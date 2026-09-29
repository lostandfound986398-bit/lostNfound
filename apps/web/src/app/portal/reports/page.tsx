import { ProgressSteps } from "@/components/progress-steps";
import Link from "next/link";
import type { ItemReportSummary } from "@lost-found/contracts";
import { portalData, reportProgress } from "@/lib/portal";
import { LoadError, PortalFeedback } from "@/components/portal-feedback";
export default async function MyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const [reports, params] = await Promise.all([
    portalData<ItemReportSummary[]>("/reports/mine", true),
    searchParams,
  ]);
  return (
    <main className="portal-content portal-content--inner">
      <div className="portal-title">
        <div>
          <span className="eyebrow">My activity</span>
          <h1>Items I reported</h1>
          <p>Track the items you reported missing or found.</p>
        </div>
        <Link href="/portal" className="button button--primary">
          Report another item
        </Link>
      </div>
      {params.success === "report_submitted" && (
        <PortalFeedback title="Your item report was submitted">
          <p>
            You can follow its progress here. A found-item report does not
            record a physical handover; contact the lost-and-found staff to
            arrange one.
          </p>
        </PortalFeedback>
      )}
      {reports === null ? (
        <LoadError href="/portal/reports" />
      ) : reports.length === 0 ? (
        <PortalFeedback title="You haven't reported any items yet">
          <p>
            Start by choosing whether you lost something or found something.
          </p>
          <Link href="/portal">Get started →</Link>
        </PortalFeedback>
      ) : (
        <div className="journey-list">
          {reports.map((report) => {
            const state = reportProgress[report.status];
            return (
              <article className="panel" key={report.id}>
                <span className="eyebrow">
                  {report.type === "LOST" ? "I lost this" : "I found this"}
                </span>
                <div className="claim-card__head">
                  <h2>{report.title}</h2>
                  <span className="status status--open">
                    {state?.label ?? report.status}
                  </span>
                </div>
                <p>
                  {report.location} ·{" "}
                  {new Date(report.occurredAt).toLocaleDateString("en-PH")}
                </p>
                <ProgressSteps kind="report" status={report.status} />
                <p>
                  <strong>Next step: </strong>
                  {report.type === "FOUND" && report.status === "OPEN"
                    ? "Your report is listed. Contact the lost-and-found staff to arrange handing over the item."
                    : state?.next}
                </p>
                <div className="journey-actions">
                  <Link href={`/portal/items/${report.id}`}>
                    View details and possible matches
                  </Link>
                  {report.type === "LOST" &&
                    !["CLAIMED", "ARCHIVED"].includes(report.status) && (
                      <Link
                        href={`/portal/search?category=${encodeURIComponent(report.category)}`}
                      >
                        Look for similar items →
                      </Link>
                    )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
