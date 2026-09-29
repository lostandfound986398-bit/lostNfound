"use server";
import { authenticatedApi } from "@/lib/api/authenticated";
export async function discardReportPhoto(key: string) {
  try {
    await authenticatedApi("/reports/photo/discard", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key }),
    });
  } catch {
    /* Retry cleanup through the maintenance task if the API is unavailable. */
  }
}
