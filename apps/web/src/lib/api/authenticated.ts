import { createClient } from "@/lib/supabase/server";

export async function authenticatedApi(path: string, init: RequestInit = {}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) return null;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";
  return fetch(`${baseUrl}/api/v1${path}`, {
    ...init,
    headers: { ...init.headers, authorization: `Bearer ${data.session.access_token}` },
    cache: "no-store",
  });
}
