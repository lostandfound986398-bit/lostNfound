import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ReportsService } from "./reports.service";

describe("ReportsService", () => {
  it("creates an open report without exposing private verification details", async () => {
    const rows: Record<string, unknown>[] = [];
    const database = {
      query: async <T>(text: string, values: unknown[] = []) => {
        if (text.includes("INSERT INTO item_reports")) {
          const report = {
            id: "report-1",
            type: values[1], title: values[2], color: values[3],
            category: values[7], location: values[8], occurred_at: new Date(values[6] as string), status: "OPEN",
          };
          rows.unshift(report);
          return { rows: [report] } as { rows: T[] };
        }
        return { rows: rows as T[] };
      },
    };
    const config = { get: () => "https://example.supabase.co" };
    const service = new ReportsService(config as never, database as never);
    const report = await service.create({ id: "user-1" } as never, {
      type: "LOST",
      title: "Blue water bottle",
      category: "Others",
      color: "Blue",
      location: "CBEA Hall",
      occurredAt: "2026-08-01T09:00:00.000Z",
      publicDescription: "Metal bottle",
      privateVerificationDetails: "Initials engraved underneath",
    });

    assert.equal(report.status, "OPEN");
    assert.equal(report.type, "LOST");
    assert.equal("privateVerificationDetails" in report, false);
    assert.equal((await service.findAll())[0]?.id, report.id);
  });
});
