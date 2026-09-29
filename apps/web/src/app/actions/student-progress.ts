"use server";
import { revalidatePath } from "next/cache";
import { authenticatedApi } from "@/lib/api/authenticated";
async function send(path: string, method: string, body?: unknown) {
  try {
    const response = await authenticatedApi(path, {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response || response.status === 401)
      return {
        error:
          "Your session has expired. Sign in again in another tab, then retry.",
      };
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      return {
        error:
          typeof data?.message === "string"
            ? data.message
            : "The change could not be saved. Check the details and refresh the page.",
      };
    }
    revalidatePath("/portal", "layout");
    revalidatePath("/admin", "layout");
    return { error: "", success: "Your change was saved." };
  } catch {
    return {
      error:
        "We couldn't connect. Your details are still here; please try again.",
    };
  }
}
export async function replyToClaim(_: { error: string }, data: FormData) {
  return send(
    `/claims/${encodeURIComponent(String(data.get("id")))}/reply`,
    "POST",
    { message: String(data.get("message") ?? "").trim() },
  );
}
export async function closeReport(_: { error: string }, data: FormData) {
  return send(
    `/reports/${encodeURIComponent(String(data.get("id")))}/close`,
    "POST",
  );
}
export async function editReport(_: { error: string }, data: FormData) {
  const body = Object.fromEntries(
    [
      "type",
      "title",
      "color",
      "category",
      "location",
      "occurredAt",
      "publicDescription",
      "privateVerificationDetails",
    ].map((key) => [key, String(data.get(key) ?? "").trim()]),
  );
  return send(
    `/reports/${encodeURIComponent(String(data.get("id")))}`,
    "PATCH",
    body,
  );
}
