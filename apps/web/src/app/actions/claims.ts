"use server";
import { redirect } from "next/navigation";
import { authenticatedApi } from "@/lib/api/authenticated";

export async function submitClaim(
  _previous: { error: string },
  formData: FormData,
) {
  const reportId = String(formData.get("reportId") ?? "");
  const ownershipAnswer = String(formData.get("ownershipAnswer") ?? "").trim();
  if (!reportId || !ownershipAnswer)
    return {
      error: "Describe how staff can confirm this item belongs to you.",
    };
  try {
    const response = await authenticatedApi("/claims", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reportId,
        ownershipAnswers: { claimantStatement: ownershipAnswer },
      }),
    });
    if (!response || response.status === 401)
      return {
        error:
          "Your session has expired. Sign in again before sending this request.",
      };
    if (!response.ok) {
      const details = await response.json().catch(() => null);
      return {
        error:
          typeof details?.message === "string"
            ? details.message
            : "Your request could not be submitted. Refresh the item to check availability.",
      };
    }
  } catch {
    return {
      error:
        "We couldn't connect. Your details are still here; please try again.",
    };
  }
  redirect("/portal/claims?success=claim_submitted");
}
