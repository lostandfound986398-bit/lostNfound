"use server";
import { revalidatePath } from "next/cache";
import { authenticatedApi } from "@/lib/api/authenticated";
export async function reviewClaim(_: { error: string }, formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  try {
    const response = await authenticatedApi(
      `/claims/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          notes: String(formData.get("notes") ?? ""),
        }),
      },
    );
    if (!response?.ok) {
      const details = await response?.json().catch(() => null);
      return {
        error:
          typeof details?.message === "string"
            ? details.message
            : "The decision could not be saved. Refresh and try again.",
      };
    }
    revalidatePath("/admin", "layout");
    revalidatePath("/portal", "layout");
    return {
      error: "",
      success:
        "Decision saved. The student's progress and updates are updated.",
    };
  } catch {
    return {
      error:
        "Couldn't connect. The decision has not been confirmed; please refresh before retrying.",
    };
  }
}
