"use server";
import { revalidatePath } from "next/cache";
import { authenticatedApi } from "@/lib/api/authenticated";
export async function markUpdateRead(_: { error: string }, data: FormData) {
  try {
    const response = await authenticatedApi(
      `/reports/updates/${encodeURIComponent(String(data.get("id")))}/read`,
      { method: "POST" },
    );
    if (!response?.ok)
      return { error: "Couldn't mark this update as read. Please try again." };
    revalidatePath("/portal", "layout");
    return { error: "" };
  } catch {
    return { error: "Couldn't connect. Please try again." };
  }
}
