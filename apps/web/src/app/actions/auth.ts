"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function message(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function login(formData: FormData) {
  const email = message(formData.get("email"));
  const password = message(formData.get("password"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/?error=invalid_credentials");
  redirect("/portal");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(formData: FormData) {
  const email = message(formData.get("email"));
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/account/update-password`,
  });
  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = message(formData.get("password"));
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/account/update-password?error=1");
  await supabase.auth.signOut();
  redirect("/?password_updated=1");
}

