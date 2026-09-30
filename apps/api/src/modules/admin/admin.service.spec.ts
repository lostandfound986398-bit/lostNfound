import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AdminService } from "./admin.service";
import type { LocalUser } from "../auth/auth.service";

const admin = { id: "admin", role: "ADMIN" } as LocalUser;
function fixture(
  options: {
    closed?: boolean;
    unavailable?: boolean;
    duplicate?: boolean;
    missingMatch?: boolean;
    ownMatch?: boolean;
  } = {},
) {
  const calls: { sql: string; values: unknown[] }[] = [];
  const query = async (sql: string, values: unknown[] = []) => {
    calls.push({ sql, values });
    if (sql.startsWith("SELECT id, reporter_id"))
      return {
        rows: [
          {
            id: "lost",
            reporter_id: "owner",
            title: "Wallet",
            type: "LOST",
            status: options.closed ? "CLAIMED" : "OPEN",
          },
        ],
      };
    if (sql.includes("JOIN item_matches"))
      return {
        rows: options.missingMatch
          ? []
          : [
              {
                id: "found",
                title: "Wallet",
                reporter_id: options.ownMatch ? "owner" : "finder",
                status: options.unavailable ? "CLAIMED" : "OPEN",
              },
            ],
      };
    if (sql.includes("SELECT id FROM notifications"))
      return { rows: options.duplicate ? [{ id: "existing" }] : [] };
    return { rows: [] };
  };
  const service = new AdminService({
    transaction: async (
      run: (db: { query: typeof query }) => Promise<unknown>,
    ) => run({ query }),
  } as never);
  return { service, calls };
}
describe("Case messages", () => {
  it("rejects non-admin callers without accessing the database", async () => {
    const { service, calls } = fixture();
    await assert.rejects(
      service.messageReporter({ role: "STUDENT" } as LocalUser, "lost", {
        kind: "DETAILS",
      }),
      /Administrator/,
    );
    assert.equal(calls.length, 0);
  });
  it("requires explicit comparison confirmation", async () => {
    const { service, calls } = fixture();
    await assert.rejects(
      service.messageReporter(admin, "lost", {
        kind: "MATCH",
        matchId: "found",
      }),
      /confirm/,
    );
    assert.equal(calls.filter((c) => c.sql.includes("INSERT")).length, 0);
  });
  for (const options of [
    { closed: true },
    { unavailable: true },
    { missingMatch: true },
    { ownMatch: true },
  ]) {
    it(`rejects an invalid target: ${JSON.stringify(options)}`, async () => {
      const { service, calls } = fixture(options);
      await assert.rejects(
        service.messageReporter(admin, "lost", {
          kind: "MATCH",
          matchId: "found",
          reviewed: true,
        }),
      );
      assert.equal(calls.filter((c) => c.sql.includes("INSERT")).length, 0);
    });
  }
  it("deduplicates notifications", async () => {
    const { service, calls } = fixture({ duplicate: true });
    await service.messageReporter(admin, "lost", { kind: "DETAILS" });
    assert.equal(calls.filter((c) => c.sql.includes("INSERT")).length, 0);
  });
  it("sends only to the report owner, records history, and never approves ownership", async () => {
    const { service, calls } = fixture();
    await service.messageReporter(admin, "lost", {
      kind: "MATCH",
      matchId: "found",
      reviewed: true,
    });
    const notification = calls.find((c) =>
      c.sql.includes("INSERT INTO notifications"),
    )!;
    assert.equal(notification.values[0], "owner");
    assert.equal(notification.values[1], "REPORT_MATCH_INVITATION");
    assert.match(String(notification.values[3]), /not approval/);
    assert.deepEqual(JSON.parse(String(notification.values[4])), {
      reportId: "lost",
      matchedReportId: "found",
    });
    assert.equal(
      calls.filter((c) => c.sql.includes("INSERT INTO audit_logs")).length,
      1,
    );
    assert.equal(
      calls.filter((c) => /^UPDATE|INSERT INTO claims/.test(c.sql)).length,
      0,
    );
  });
  it("requests private details with an edit-report instruction", async () => {
    const { service, calls } = fixture();
    await service.messageReporter(admin, "lost", { kind: "DETAILS" });
    const notification = calls.find((c) =>
      c.sql.includes("INSERT INTO notifications"),
    )!;
    assert.equal(notification.values[1], "REPORT_DETAILS_REQUESTED");
    assert.match(String(notification.values[3]), /Edit report/);
  });
});
