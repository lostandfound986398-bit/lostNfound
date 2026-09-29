import { ClaimReply } from "@/components/claim-reply";
import { StaffContact } from "@/components/staff-contact";
import { ProgressSteps } from "@/components/progress-steps";
import Link from "next/link";
import { portalData, claimProgress } from "@/lib/portal";
import { LoadError, PortalFeedback } from "@/components/portal-feedback";
interface Claim {
  id: string;
  reportId: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  title: string;
}
export default async function MyClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const [claims, params] = await Promise.all([
    portalData<Claim[]>("/claims/mine", true),
    searchParams,
  ]);
  return (
    <main className="portal-content portal-content--inner">
      <div className="portal-title">
        <div>
          <span className="eyebrow">Track collection</span>
          <h1>My ownership requests</h1>
          <p>
            These are items you asked to collect because you believe they belong
            to you.
          </p>
        </div>
        <Link href="/portal/search">Find an item</Link>
      </div>
      {params.success === "claim_submitted" && (
        <PortalFeedback title="Your ownership request was sent">
          <p>
            Staff will review your details. Check this page for their decision
            and next steps.
          </p>
        </PortalFeedback>
      )}
      {claims === null ? (
        <LoadError href="/portal/claims" />
      ) : claims.length === 0 ? (
        <PortalFeedback title="You haven't requested an item yet">
          <p>
            When you recognize an item, open its details and choose “This might
            be mine.”
          </p>
          <Link href="/portal/search" className="button button--primary">
            Look for my item
          </Link>
        </PortalFeedback>
      ) : (
        <div className="journey-list">
          {claims.map((claim) => {
            const state = claimProgress[claim.status] ?? {
              label: claim.status,
              next: "Contact staff for an update.",
            };
            return (
              <article
                className="panel claim-progress-card"
                key={claim.id}
                id={`claim-${claim.id}`}
              >
                <div className="claim-card__head">
                  <h2>{claim.title}</h2>
                  <span className="status status--pending">{state.label}</span>
                </div>
                <ProgressSteps kind="claim" status={claim.status} />
                <p
                  className={
                    ["NEEDS_INFORMATION", "APPROVED"].includes(claim.status)
                      ? "next-step next-step--attention"
                      : "next-step"
                  }
                >
                  <strong>Next step: </strong>
                  {state.next}
                </p>
                {claim.reviewNotes && (
                  <blockquote>
                    <strong>Staff note</strong>
                    <p>{claim.reviewNotes}</p>
                  </blockquote>
                )}
                {claim.status === "NEEDS_INFORMATION" && (
                  <ClaimReply id={claim.id} />
                )}
                <p className="muted">
                  Requested{" "}
                  {new Date(claim.createdAt).toLocaleDateString("en-PH")}
                </p>
                <Link href={`/portal/items/${claim.reportId}`}>
                  View item details →
                </Link>
              </article>
            );
          })}
        </div>
      )}
      <StaffContact />
    </main>
  );
}
