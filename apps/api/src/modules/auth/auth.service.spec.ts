import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthService } from "./auth.service";
import type { RegisterDto } from "./dto/register.dto";

const studentInput: RegisterDto = {
  role: "STUDENT",
  schoolId: "230617",
  fullName: "Ian Dave Punayo",
  email: "ianpunayo09@gmail.com",
  password: "SecurePassword2026!",
};

function authService(
  query: (sql: string, values?: unknown[]) => Promise<{ rows: unknown[] }>,
) {
  let createUserCalls = 0;
  const service = new AuthService(
    {
      getOrThrow: (key: string) =>
        key === "SUPABASE_URL"
          ? "https://example.supabase.co"
          : "test-publishable-key",
      get: (_key: string, fallback: string) => fallback,
    } as never,
    { query } as never,
  );
  Object.assign(service, {
    adminClient: {
      auth: {
        admin: {
          createUser: async () => {
            createUserCalls += 1;
            return { data: { user: { id: "new-user" } }, error: null };
          },
          deleteUser: async () => ({ error: null }),
        },
      },
    },
  });
  return { service, createUserCalls: () => createUserCalls };
}

describe("Student self-registration", () => {
  it("creates an internal directory link for a student not yet on the master list", async () => {
    const writes: Array<{ sql: string; values: unknown[] }> = [];
    const { service, createUserCalls } = authService(
      async (sql, values = []) => {
        if (sql.includes("FROM master_people mp")) return { rows: [] };
        if (sql.includes("INSERT INTO master_people")) {
          writes.push({ sql, values });
          return {
            rows: [
              {
                id: "new-record",
                school_id: "230617",
                full_name: "Ian Dave Punayo",
                email: "ianpunayo09@gmail.com",
                role: "STUDENT",
                is_active: true,
                user_id: null,
              },
            ],
          };
        }
        if (sql.includes("INSERT INTO users")) {
          writes.push({ sql, values });
          return { rows: [] };
        }
        throw new Error(`Unexpected query: ${sql}`);
      },
    );

    await service.register(studentInput);

    assert.equal(createUserCalls(), 1);
    assert.equal(writes.length, 2);
    assert.deepEqual(writes[0]?.values, [
      "230617",
      "Ian Dave Punayo",
      "ianpunayo09@gmail.com",
    ]);
    assert.match(writes[1]?.sql ?? "", /INSERT INTO users/);
  });

  it("does not allow a student to overwrite a reserved School ID", async () => {
    const { service, createUserCalls } = authService(async () => ({
      rows: [
        {
          id: "reserved-record",
          school_id: "230617",
          full_name: "A Different Student",
          email: "different@example.com",
          role: "STUDENT",
          is_active: true,
          user_id: null,
        },
      ],
    }));

    await assert.rejects(service.register(studentInput), /reserved/);
    assert.equal(createUserCalls(), 0);
  });

  it("continues to require Faculty and Staff to appear in the directory", async () => {
    const { service, createUserCalls } = authService(async () => ({
      rows: [],
    }));

    await assert.rejects(
      service.register({ ...studentInput, role: "FACULTY" }),
      /could not be verified/,
    );
    assert.equal(createUserCalls(), 0);
  });
});
