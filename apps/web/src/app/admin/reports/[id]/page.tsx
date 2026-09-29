import Link from "next/link";
import { notFound } from "next/navigation";
import { authenticatedApi } from "@/lib/api/authenticated";
import { reportProgress } from "@/lib/portal";
import { LoadError } from "@/components/portal-feedback";

interface Report {
  id: string;
  title: string;
  type: string;
  status: string;
  color: string;
  publicDescription: string | null;
  privateVerificationDetails: string | null;
  occurredAt: string;
  createdAt: string;
  category: string;
  location: string;
  reporterName: string;
  reporterEmail: string;
  schoolId: string;
  images: { storageKey: string }[];
  matches: {
    id: string;
    title: string;
    reportStatus: string;
    status: string;
    score: string;
    reasons: string[];
    location: string;
  }[];
}
export default async function AdminReportDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    notFound();
  let response: Response | null;
  try {
    response = await authenticatedApi(`/admin/reports/${id}`);
  } catch {
    return (
      <main className="page">
        <LoadError href={`/admin/reports/${id}`} />
      </main>
    );
  }
  if (response?.status === 404) notFound();
  if (!response?.ok)
    return (
      <main className="page">
        <LoadError href={`/admin/reports/${id}`} />
      </main>
    );
  const report = (await response.json()) as Report;
  const lost = report.type === "LOST";
  return (
    <main className="page">
      <Link href={`/admin/reports?type=${lost ? "lost" : "found"}`}>
        ← Back to {lost ? "lost" : "found"} reports
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {lost ? "Student lost-item report" : "Found-item report"}
          </span>
          <h1>{report.title}</h1>
          <span className="status status--open">
            {reportProgress[report.status]?.label ?? report.status}
          </span>
        </div>
      </div>
      <div className="journey-detail">
        <section className="panel">
          <h2>Report details</h2>
          {report.images.length > 0 && (
            <div className="journey-gallery">
              {report.images.map((image, i) => (
                <img
                  key={image.storageKey}
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/report-photos/${image.storageKey}`}
                  alt={`${report.title}, photo ${i + 1}`}
                />
              ))}
            </div>
          )}
          <dl className="journey-facts">
            {Object.entries({
              Category: report.category,
              Color: report.color,
              Location: report.location,
              "Date lost or found": new Date(
                report.occurredAt,
              ).toLocaleDateString("en-PH"),
              "Submitted by": report.reporterName,
              "School ID": report.schoolId,
              "School email": report.reporterEmail,
              "Public description": report.publicDescription || "Not provided",
              "Private verification details — staff only":
                report.privateVerificationDetails || "Not provided",
            }).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <aside className="panel">
          <h2>What should I do?</h2>
          {report.status === "CLAIMED" || report.status === "ARCHIVED" ? (
            <p>{reportProgress[report.status]?.next}</p>
          ) : (
            <ol className="admin-next-steps">
              <li>
                Review the description and the student's private identifying
                details.
              </li>
              <li>
                {lost
                  ? "Compare the possible found items below. If nothing matches, keep this report open while waiting for a found-item report."
                  : "Check the item and arrange handover with the finder. A submitted report does not confirm physical custody."}
              </li>
              <li>
                {lost
                  ? "If a found item looks right, contact the student through their school email and ask them to submit an ownership request from that item's page."
                  : "Compare each ownership request against the item and its private identifying details."}
              </li>
              <li>
                Review the ownership request, then verify the school ID and
                record collection when the item is handed over.
              </li>
            </ol>
          )}
          <p>
            A possible match is a suggestion, not proof of ownership. A
            lost-item report does not need a claim decision until a found item
            is identified.
          </p>
          <Link className="button button--primary" href="/admin/claims">
            Review ownership requests
          </Link>
        </aside>
      </div>
      <section className="panel" style={{ marginTop: 24 }}>
        <div className="section-head">
          <h2>Possible {lost ? "found" : "lost"} items</h2>
          <Link href={`/admin/reports?type=${lost ? "found" : "lost"}`}>
            Browse all {lost ? "found" : "lost"} reports
          </Link>
        </div>
        {report.matches.length === 0 ? (
          <p>
            No automatic matches yet. Compare other reports manually, or keep
            this report open until a similar item is reported.
          </p>
        ) : (
          <div className="journey-list">
            {report.matches.map((match) => (
              <article className="journey-task" key={match.id}>
                <Link href={`/admin/reports/${match.id}`}>
                  <strong>{match.title} →</strong>
                </Link>
                <span>
                  {match.location} ·{" "}
                  {reportProgress[match.reportStatus]?.label ??
                    match.reportStatus}
                </span>
                <span>
                  Matching clues:{" "}
                  {match.reasons.join(", ") || "Similar report details"}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
