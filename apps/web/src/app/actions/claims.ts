"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitClaim(formData: FormData) {
  const reportId = String(formData.get("reportId") ?? "");
  const ownershipAnswer = String(formData.get("ownershipAnswer") ?? "").trim();
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token || !reportId || !ownershipAnswer) redirect("/portal/search?error=claim_failed");
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/claims`, {
    method: "POST", headers: { authorization: `Bearer ${data.session.access_token}`, "content-type": "application/json" },
    body: JSON.stringify({ reportId, ownershipAnswers: { claimantStatement: ownershipAnswer } }), cache: "no-store",
  });
  redirect(response.ok ? "/portal/claims?success=claim_submitted" : "/portal/search?error=claim_failed");
}
