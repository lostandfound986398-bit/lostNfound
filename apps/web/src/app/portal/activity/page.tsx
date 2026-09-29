import Link from "next/link";
import { portalData } from "@/lib/portal";
import { LoadError } from "@/components/portal-feedback";
export default async function ActivityPage() {
  const claims =
    await portalData<{ id: string; title: string; status: string }[]>(
      "/claims/mine",
    );
  const attention =
    claims?.filter((claim) =>
      ["NEEDS_INFORMATION", "APPROVED"].includes(claim.status),
    ) ?? [];
  return (
    <main className="portal-content portal-content--inner">
      <div className="portal-title">
        <div>
          <span className="eyebrow">Your next steps</span>
          <h1>My Activity</h1>
          <p>Follow your reports and ownership requests in one place.</p>
        </div>
      </div>
      {claims === null ? (
        <LoadError href="/portal/activity" />
      ) : (
        attention.length > 0 && (
          <section
            className="attention-panel"
            aria-label="Needs your attention"
          >
            <h2>Needs your attention</h2>
            {attention.map((claim) => (
              <Link key={claim.id} href={`/portal/claims#claim-${claim.id}`}>
                <strong>{claim.title}</strong>
                <span>
                  {claim.status === "APPROVED"
                    ? "Ready to collect — arrange pickup"
                    : "Staff need more details — send a reply"}{" "}
                  →
                </span>
              </Link>
            ))}
          </section>
        )
      )}
      <section className="journey-choices" aria-label="Activity types">
        <Link className="journey-choice" href="/portal/reports">
          <h2>Items I reported</h2>
          <p>
            See matches, correct details, or close a report you no longer need.
          </p>
          <strong>View my reports →</strong>
        </Link>
        <Link className="journey-choice" href="/portal/claims">
          <h2>My ownership requests</h2>
          <p>
            Read staff decisions, reply privately, and check collection
            instructions.
          </p>
          <strong>View my requests →</strong>
        </Link>
      </section>
      <div className="journey-actions">
        <Link className="button button--primary" href="/portal/report/lost">
          Report a missing item
        </Link>
        <Link className="button button--secondary" href="/portal/report/found">
          Report a found item
        </Link>
      </div>
    </main>
  );
}
