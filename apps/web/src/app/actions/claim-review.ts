"use server";
import { revalidatePath } from "next/cache";
import { authenticatedApi } from "@/lib/api/authenticated";
export async function reviewClaim(formData: FormData) { const id = String(formData.get("id") ?? ""); const status = String(formData.get("status") ?? ""); if (!id || !status) return; await authenticatedApi(`/claims/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, notes: String(formData.get("notes") ?? "") }) }); revalidatePath("/admin/claims"); }
