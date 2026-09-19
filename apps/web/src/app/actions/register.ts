"use server";

import { redirect } from "next/navigation";

function value(formData: FormData, key: string) {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

export async function register(formData: FormData) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: value(formData, "role"),
        schoolId: value(formData, "schoolId"),
        fullName: value(formData, "fullName"),
        email: value(formData, "email"),
        password: value(formData, "password"),
      }),
      cache: "no-store",
    });
  } catch {
    redirect("/register?error=connection_error");
  }

  if (!response.ok) redirect("/register?error=verification_failed");
  redirect("/register?success=check_email");
}
