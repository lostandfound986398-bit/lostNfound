import Link from "next/link";
import { portalData } from "@/lib/portal";
import { LoadError, PortalFeedback } from "@/components/portal-feedback";
import { UpdateReadButton } from "@/components/update-read-button";
interface Update {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  targetReportId: string | null;
  data?: { reportId?: string; matchedReportId?: string; claimId?: string };
}
export default async function UpdatesPage() {
  const updates = await portalData<Update[]>("/reports/updates");
  return (
    <main className="portal-content portal-content--inner">
      <div className="portal-title">
        <div>
          <span className="eyebrow">My activity</span>
          <h1>Updates</h1>
          <p>
            Match suggestions, ownership decisions, and campus announcements.
            Refresh to check for new updates.
          </p>
        </div>
        <Link href="/portal/updates">Refresh updates</Link>
      </div>
      {updates === null ? (
        <LoadError href="/portal/updates" />
      ) : updates.length === 0 ? (
        <PortalFeedback title="You're up to date">
          <p>
            Your updates will appear here as staff review requests and matching
            items are reported.
          </p>
        </PortalFeedback>
      ) : (
        <div className="journey-list">
          {updates.map((update) => (
            <article className="panel" key={update.id}>
              <p className="muted">
                {new Date(update.createdAt).toLocaleString("en-PH", {
                  timeZone: "Asia/Manila",
                })}
              </p>
              {!update.readAt && (
                <span className="status status--open">Unread</span>
              )}
              <h2>{update.title}</h2>
              <p>{update.body}</p>
              <div className="journey-actions">
                {update.type === "REPORT_MATCH_INVITATION" ||
                update.type === "REPORT_DETAILS_REQUESTED" ? (
                  <Link
                    href={`/portal/items/${encodeURIComponent(update.data?.matchedReportId ?? update.data?.reportId ?? "")}`}
                  >
                    {update.type === "REPORT_MATCH_INVITATION"
                      ? "Inspect possible match →"
                      : "Open report to add details →"}
                  </Link>
                ) : update.type === "MATCH_FOUND" ? (
                  <Link
                    href={
                      update.targetReportId
                        ? `/portal/items/${encodeURIComponent(update.targetReportId)}`
                        : "/portal/reports"
                    }
                  >
                    View report and possible matches →
                  </Link>
                ) : update.type.startsWith("CLAIM_") ? (
                  <Link
                    href={
                      update.data?.claimId
                        ? `/portal/claims#claim-${encodeURIComponent(update.data.claimId)}`
                        : "/portal/claims"
                    }
                  >
                    View ownership request →
                  </Link>
                ) : null}
                {!update.readAt && <UpdateReadButton id={update.id} />}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
