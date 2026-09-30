import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ReportsService } from "./reports.service";
import { ClaimsService } from "../claims/claims.service";
import type { LocalUser } from "../auth/auth.service";

const owner = { id: "owner", role: "STUDENT" } as LocalUser;
const student = { id: "student", role: "STUDENT" } as LocalUser;
const admin = { id: "admin", role: "ADMIN" } as LocalUser;

describe("Private notification state", () => {
  it("scopes read changes to the signed-in user and rejects missing updates", async () => {
    let parameters: unknown[] = [];
    const service = new ReportsService(
      { get: () => "" } as never,
      {
        query: async (sql: string, values: unknown[]) => {
          assert.match(sql, /WHERE id = \$1 AND user_id = \$2/);
          parameters = values;
          return { rows: [] };
        },
      } as never,
    );
    await assert.rejects(
      service.readUpdate(student.id, "someone-elses-update"),
      /Update not found/,
    );
    assert.deepEqual(parameters, ["someone-elses-update", student.id]);
  });
  it("counts only unread updates for the signed-in user", async () => {
    const service = new ReportsService(
      { get: () => "" } as never,
      {
        query: async (sql: string, values: unknown[]) => {
          assert.match(sql, /WHERE user_id = \$1 AND read_at IS NULL/);
          assert.deepEqual(values, [student.id]);
          return { rows: [{ unread: 3 }] };
        },
      } as never,
    );
    assert.deepEqual(await service.unreadUpdates(student.id), { unread: 3 });
  });
});
const input = {
  type: "LOST" as const,
  title: "Blue bottle",
  category: "Others",
  color: "Blue",
  location: "CBEA Building",
  occurredAt: "2026-08-01",
  privateVerificationDetails: "Secret mark",
};
function reportService(status = "OPEN", type = "FOUND") {
  const database = {
    query: async (sql: string) => {
      if (
        sql.includes("FROM item_reports r") &&
        sql.includes("WHERE r.id = $1")
      )
        return {
          rows: [
            {
              id: "item",
              reporter_id: owner.id,
              title: input.title,
              type,
              category: input.category,
              color: input.color,
              location: input.location,
              occurred_at: new Date(input.occurredAt),
              status,
              private_verification_details: input.privateVerificationDetails,
              reporter_name: "Private Name",
            },
          ],
        };
      if (sql.includes("FROM item_matches m"))
        return {
          rows: [
            {
              id: "match",
              title: "Matching bottle",
              status: "OPEN",
              reasons: ["same color"],
            },
          ],
        };
      return { rows: [] };
    },
  };
  return new ReportsService(
    { get: () => "https://example.supabase.co" } as never,
    database as never,
  );
}

describe("Student report visibility and ownership eligibility", () => {
  it("only reveals private clues and match suggestions to the report owner", async () => {
    const service = reportService();
    const own = await service.findOne("item", owner);
    const other = await service.findOne("item", student);
    assert.equal(own.privateVerificationDetails, "Secret mark");
    assert.equal(own.matches.length, 1);
    assert.equal(own.canRequest, false);
    assert.equal(other.canRequest, true);
    assert.equal("privateVerificationDetails" in other, false);
    assert.equal("reporterName" in other, false);
    assert.deepEqual(other.matches, []);
  });
  for (const status of ["CLAIM_PENDING", "CLAIMED"]) {
    it(`does not offer an ownership request for ${status}`, async () => {
      assert.equal(
        (await reportService(status).findOne("item", student)).canRequest,
        false,
      );
    });
  }
  it("does not offer requests for lost items", async () => {
    assert.equal(
      (await reportService("OPEN", "LOST").findOne("item", student)).canRequest,
      false,
    );
  });
  it("only lets the owner or an administrator open archived reports", async () => {
    const service = reportService("ARCHIVED");
    await assert.rejects(service.findOne("item", student), /Report not found/);
    assert.equal((await service.findOne("item", owner)).status, "ARCHIVED");
    assert.equal((await service.findOne("item", admin)).status, "ARCHIVED");
  });
  it("rejects blank names, future dates and another student's upload before writing", async () => {
    const service = reportService();
    await assert.rejects(
      service.create(owner, { ...input, title: " " }),
      /item name/,
    );
    await assert.rejects(
      service.create(owner, { ...input, occurredAt: "2999-01-01" }),
      /valid date/,
    );
    await assert.rejects(
      service.create(owner, {
        ...input,
        images: [
          {
            storageKey: "other/file.png",
            mimeType: "image/png",
            sizeBytes: 12,
          },
        ],
      }),
      /own photo/,
    );
  });
  it("does not expose matches or private data through submission responses", async () => {
    const database = {
      query: async (sql: string) => {
        if (
          sql.includes("INSERT INTO item_reports") ||
          sql.includes("WHERE r.id = $1")
        )
          return {
            rows: [
              {
                id: "item",
                reporter_id: owner.id,
                type: "LOST",
                title: input.title,
                color: input.color,
                category: input.category,
                location: input.location,
                occurred_at: new Date(input.occurredAt),
                status: "OPEN",
                private_verification_details: "secret",
              },
            ],
          };
        return { rows: [] };
      },
      transaction: async <T>(work: (db: unknown) => Promise<T>) =>
        work(database),
    };
    // Match computation has its own response shape.
    const original = database.query;
    database.query = async (sql) =>
      sql.includes("WITH source") ? { rows: [] } : original(sql);
    const service = new ReportsService(
      { get: () => "https://example.supabase.co" } as never,
      database as never,
    );
    const created = await service.create(owner, input);
    assert.equal(created.status, "OPEN");
    assert.equal("privateVerificationDetails" in created, false);
  });
});

function claimService(status: string, available = true) {
  const writes: string[] = [];
  const writeValues: unknown[][] = [];
  const database = {
    query: async (sql: string, values: unknown[] = []) => {
      if (sql.includes("SELECT cl.claimant_id"))
        return {
          rows: [
            { claimant_id: student.id, report_id: "item", title: "Bottle" },
          ],
        };
      if (sql.includes("SELECT status FROM claims"))
        return { rows: [{ status }] };
      if (sql.startsWith("SELECT id FROM item_reports"))
        return { rows: available ? [{ id: "item" }] : [] };
      writes.push(sql);
      writeValues.push(values);
      return { rows: sql.includes("RETURNING id") ? [{ id: "claim" }] : [] };
    },
    transaction: async <T>(work: (db: unknown) => Promise<T>) => work(database),
  };
  return {
    service: new ClaimsService(
      database as never,
      {
        get: () => "CBEA Faculty Office",
      } as never,
    ),
    writes,
    writeValues,
  };
}

describe("Ownership review safeguards", () => {
  it("rejects unavailable items without creating a claim", async () => {
    const { service, writes } = claimService("PENDING", false);
    await assert.rejects(
      service.create(student, {
        reportId: "item",
        ownershipAnswers: { claimantStatement: "My initials" },
      }),
      /already under review/,
    );
    assert.equal(writes.length, 0);
  });
  it("requires an ownership explanation", async () => {
    await assert.rejects(
      claimService("PENDING").service.create(student, {
        reportId: "item",
        ownershipAnswers: {},
      }),
      /ownership details/,
    );
  });
  it("prevents collection before approval and reopening a completed claim", async () => {
    for (const [current, next] of [
      ["PENDING", "RELEASED"],
      ["RELEASED", "REJECTED"],
      ["REJECTED", "APPROVED"],
    ] as const) {
      const { service, writes } = claimService(current);
      await assert.rejects(
        service.review(admin, "claim", { status: next, notes: "note" }),
        /no longer available/,
      );
      assert.equal(writes.length, 0);
    }
  });
  it("requires a helpful staff note when more information is needed or a request is rejected", async () => {
    for (const status of ["NEEDS_INFORMATION", "REJECTED"] as const) {
      const { service, writes } = claimService("PENDING");
      await assert.rejects(
        service.review(admin, "claim", { status, notes: " " }),
        /Explain/,
      );
      assert.equal(writes.length, 0);
    }
  });
  it("does not let a student review requests", async () => {
    await assert.rejects(
      claimService("PENDING").service.review(student, "claim", {
        status: "APPROVED",
        notes: "",
      }),
      /Administrator/,
    );
  });
  it("records release and notifies the student after approval", async () => {
    const { service, writes } = claimService("APPROVED");
    assert.equal(
      (
        await service.review(admin, "claim", {
          status: "RELEASED",
          notes: "School ID checked",
        })
      ).status,
      "RELEASED",
    );
    assert.ok(
      writes.some((sql) => sql.includes("INSERT INTO release_transactions")),
    );
    assert.ok(writes.some((sql) => sql.includes("INSERT INTO notifications")));
  });
  it("tells the student where to collect an approved item", async () => {
    const { service, writes, writeValues } = claimService("PENDING");
    await service.review(admin, "claim", {
      status: "APPROVED",
      notes: "Ask for Ms. Reyes.",
    });
    const notificationIndex = writes.findIndex((sql) =>
      sql.includes("INSERT INTO notifications"),
    );
    assert.notEqual(notificationIndex, -1);
    assert.match(
      String(writeValues[notificationIndex]?.[2]),
      /Claim your item at the CBEA Faculty Office/,
    );
    assert.match(
      String(writeValues[notificationIndex]?.[3]),
      /Bring your school ID.*Ask for Ms\. Reyes/,
    );
  });
  it("rejects replies to requests that are not waiting for information", async () => {
    const service = new ClaimsService(
      { query: async () => ({ rows: [] }) } as never,
      { get: () => "CBEA Faculty Office" } as never,
    );
    await assert.rejects(
      service.reply(student, "claim", "More details"),
      /no longer waiting/,
    );
  });
});

describe("API authentication and transaction boundaries", () => {
  it("guards all report endpoints, including options and updates", async () => {
    const { ReportsController } = await import("./reports.controller.js");
    const { AuthGuard } = await import("../auth/auth.guard.js");
    assert.ok(
      Reflect.getMetadata("__guards__", ReportsController).includes(AuthGuard),
    );
    const guard = new AuthGuard({} as never);
    await assert.rejects(
      guard.canActivate({
        switchToHttp: () => ({ getRequest: () => ({ headers: {} }) }),
      } as never),
      /Authentication is required/,
    );
  });
  for (const fail of [false, true]) {
    it(
      fail
        ? "rolls back failed work and releases the connection"
        : "commits successful work and releases the connection",
      async () => {
        const { DatabaseService } =
          await import("../../database/database.service.js");
        const events: string[] = [];
        const client = {
          query: async (sql: string) => {
            events.push(sql);
            return { rows: [] };
          },
          release: () => events.push("RELEASE"),
        };
        const database = Object.create(
          DatabaseService.prototype,
        ) as InstanceType<typeof DatabaseService>;
        Object.defineProperty(database, "pool", {
          value: { connect: async () => client },
        });
        const operation = database.transaction(async (db) => {
          await db.query("WRITE");
          if (fail) throw Error("failed write");
          return "saved";
        });
        if (fail) await assert.rejects(operation, /failed write/);
        else assert.equal(await operation, "saved");
        assert.deepEqual(events, [
          "BEGIN",
          "WRITE",
          fail ? "ROLLBACK" : "COMMIT",
          "RELEASE",
        ]);
      },
    );
  }
});
