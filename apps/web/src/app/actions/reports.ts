"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

export async function submitReport(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const type = value(formData, "type");
  if (!token || (type !== "LOST" && type !== "FOUND")) redirect("/?error=session_expired");

  const imageKey = value(formData, "imageKey");
  const mimeType = value(formData, "mimeType");
  const sizeBytes = Number.parseInt(value(formData, "sizeBytes") || "0", 10);

  const images = imageKey
    ? [{ storageKey: imageKey, mimeType: mimeType || "image/jpeg", sizeBytes, isPrimary: true }]
    : undefined;

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      type,
      title: value(formData, "title"),
      category: value(formData, "category"),
      color: value(formData, "color"),
      location: value(formData, "location"),
      occurredAt: value(formData, "occurredAt"),
      publicDescription: value(formData, "publicDescription") || undefined,
      privateVerificationDetails: value(formData, "privateVerificationDetails") || undefined,
      images,
    }),
    cache: "no-store",
  });

  if (!response.ok) redirect(`/portal/report/${type.toLowerCase()}?error=submission_failed`);
  redirect("/portal/reports?success=report_submitted");
}
