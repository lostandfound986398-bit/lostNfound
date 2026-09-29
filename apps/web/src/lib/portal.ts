import { authenticatedApi } from "@/lib/api/authenticated";

export async function portalData<T>(
  path: string,
  authenticated = true,
): Promise<T | null> {
  try {
    const response = authenticated
      ? await authenticatedApi(path)
      : await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000"}/api/v1${path}`,
          { cache: "no-store" },
        );
    return response?.ok ? ((await response.json()) as T) : null;
  } catch {
    return null;
  }
}

export const reportProgress: Record<string, { label: string; next: string }> = {
  DRAFT: { label: "Draft", next: "This report has not been published." },
  OPEN: {
    label: "Looking for a match",
    next: "Your report is listed. Check found items for something that looks familiar.",
  },
  MATCHED: {
    label: "Possible match",
    next: "Open your report to view possible matches. Compare their details before sending an ownership request.",
  },
  CLAIM_PENDING: {
    label: "Ownership under review",
    next: "Staff are reviewing an ownership request for this item.",
  },
  CLAIMED: {
    label: "Returned to owner",
    next: "The handover has been recorded. No further action is needed.",
  },
  ARCHIVED: { label: "Closed", next: "This report is no longer active." },
};
export const claimProgress: Record<string, { label: string; next: string }> = {
  PENDING: {
    label: "Under review",
    next: "Staff are reviewing your ownership details. No action is needed yet.",
  },
  NEEDS_INFORMATION: {
    label: "More details needed",
    next: "Read the staff note below and send the requested information using the reply form.",
  },
  APPROVED: {
    label: "Approved for collection",
    next: "Contact the lost-and-found staff to arrange collection. Bring your school ID; staff will record the handover.",
  },
  REJECTED: {
    label: "Not approved",
    next: "Read the staff explanation below. You can continue searching for your item.",
  },
  RELEASED: {
    label: "Collected",
    next: "Your item has been handed over. No further action is needed.",
  },
};
