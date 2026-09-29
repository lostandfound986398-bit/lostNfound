"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

export async function submitReport(
  _previous: { error: string },
  formData: FormData,
) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const type = value(formData, "type");
  if (!token)
    return {
      error:
        "Your session has expired. Sign in again before submitting. Keep this page open to retain your details.",
    };
  if (type !== "LOST" && type !== "FOUND")
    return {
      error: "Choose whether you lost or found the item, then try again.",
    };

  const imageKey = value(formData, "imageKey");
  const mimeType = value(formData, "mimeType");
  const sizeBytes = Number.parseInt(value(formData, "sizeBytes") || "0", 10);

  const images = imageKey
    ? [
        {
          storageKey: imageKey,
          mimeType: mimeType || "image/jpeg",
          sizeBytes,
          isPrimary: true,
        },
      ]
    : undefined;

  let response: Response;
  try {
    response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000"}/api/v1/reports`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          type,
          title: value(formData, "title"),
          category: value(formData, "category"),
          color: value(formData, "color"),
          location: value(formData, "location"),
          occurredAt: value(formData, "occurredAt"),
          publicDescription: value(formData, "publicDescription") || undefined,
          privateVerificationDetails:
            value(formData, "privateVerificationDetails") || undefined,
          images,
        }),
        cache: "no-store",
      },
    );
  } catch {
    return {
      error:
        "We couldn’t connect. Your details are still here; please try again.",
    };
  }
  if (!response.ok) {
    const details = await response.json().catch(() => null);
    return {
      error:
        response.status === 401
          ? "Your session has expired. Sign in again in another tab, then retry."
          : typeof details?.message === "string"
            ? details.message
            : "Your report could not be submitted. Check the details and try again.",
    };
  }
  redirect("/portal/reports?success=report_submitted");
}
