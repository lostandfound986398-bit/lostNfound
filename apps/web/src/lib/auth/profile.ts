import { createClient } from "@/lib/supabase/server";

export interface CurrentProfile {
  id: string;
  email: string;
  displayName: string;
  role: "STUDENT" | "FACULTY" | "STAFF" | "ADMIN";
  status: "ACTIVE" | "PENDING" | "DEACTIVATED";
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return response.ok ? ((await response.json()) as CurrentProfile) : null;
  } catch {
    return null;
  }
}
