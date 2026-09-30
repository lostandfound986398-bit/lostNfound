"use server";
import { revalidatePath } from "next/cache";
import { authenticatedApi } from "@/lib/api/authenticated";
export async function messageReporter(
  _: { error: string; success?: string },
  form: FormData,
) {
  const id = String(form.get("id") ?? "");
  try {
    const response = await authenticatedApi(
      `/admin/reports/${encodeURIComponent(id)}/message`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: form.get("kind"),
          ...(form.get("matchId")
            ? {
                matchId: form.get("matchId"),
                reviewed: form.get("reviewed") === "on",
              }
            : {}),
        }),
      },
    );
    const result = await response?.json().catch(() => null);
    if (!response?.ok)
      return {
        error:
          typeof result?.message === "string"
            ? result.message
            : "Message could not be sent. Please try again.",
      };
    revalidatePath(`/admin/reports/${id}`);
    revalidatePath("/portal", "layout");
    return { error: "", success: result.message as string };
  } catch {
    return {
      error:
        "Could not confirm delivery. Refresh the case history before retrying.",
    };
  }
}
