"use server";

import { revalidatePath } from "next/cache";
import { authenticatedApi } from "@/lib/api/authenticated";

export async function changeUserStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await authenticatedApi(`/admin/users/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ active }),
  });
  revalidatePath("/admin/users");
}

export async function publishAnnouncement(formData: FormData) {
  const audience = String(formData.get("audience") ?? "");
  await authenticatedApi("/admin/announcements", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: String(formData.get("title") ?? ""),
      body: String(formData.get("body") ?? ""),
      audience: audience || undefined,
    }),
  });
  revalidatePath("/admin/announcements");
}

export async function createCategoryAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await authenticatedApi("/admin/categories", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  revalidatePath("/admin/settings");
}

export async function toggleCategoryAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await authenticatedApi(`/admin/categories/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ active }),
  });
  revalidatePath("/admin/settings");
}

export async function createLocationAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await authenticatedApi("/admin/locations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  revalidatePath("/admin/settings");
}

export async function toggleLocationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await authenticatedApi(`/admin/locations/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ active }),
  });
  revalidatePath("/admin/settings");
}
