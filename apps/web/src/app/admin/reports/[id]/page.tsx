import Link from "next/link";
import { notFound } from "next/navigation";
import { authenticatedApi } from "@/lib/api/authenticated";
import { reportProgress } from "@/lib/portal";
import { LoadError } from "@/components/portal-feedback";
import { CaseMessageForm } from "@/components/case-message-form";
import { ClaimReviewForm } from "@/components/claim-review-form";

interface Item {
  id: string;
  title: string;
  category: string;
  color: string;
  location: string;
  occurredAt: string;
}
interface Report extends Item {
  type: string;
  status: string;
  createdAt: string;
  publicDescription: string | null;
  privateVerificationDetails: string | null;
  reporterName: string;
  reporterEmail: string;
  schoolId: string;
  images: { storageKey: string }[];
  matches: (Item & {
    reportStatus: string;
    reasons: string[];
    storageKey: string | null;
    description: string | null;
  })[];
  claims: {
    id: string;
    reportId: string;
    title: string;
    status: string;
    ownershipAnswers: {
      claimantStatement?: string;
      additionalInformation?: string[];
    };
    claimantName: string;
    createdAt: string;
    reviewNotes: string | null;
  }[];
  history: {
    action: string;
    createdAt: string;
    details: { matchedReportId?: string; notes?: string } | null;
  }[];
}
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const photo = (key: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/report-photos/${key}`;
const label = (status: string) =>
  reportProgress[status]?.label ?? status.replaceAll("_", " ");
const events: Record<string, string> = {
  REPORT_MATCH_INVITATION: "Student notified of a possible match",
  REPORT_DETAILS_REQUESTED: "Identifying details requested",
  REVIEW_CLAIM_APPROVED: "Collection approved",
  REVIEW_CLAIM_RELEASED: "Item collected",
  REVIEW_CLAIM_REJECTED: "Ownership request not approved",
  REVIEW_CLAIM_NEEDS_INFORMATION: "More ownership information requested",
};

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
  const claims = report.claims ?? [];
  const history = report.history ?? [];
  const available = report.matches.filter((m) =>
    ["OPEN", "MATCHED"].includes(m.reportStatus),
  );
  const unavailable = report.matches.filter(
    (m) => !["OPEN", "MATCHED"].includes(m.reportStatus),
  );
  const active = claims.filter(
    (c) => !["RELEASED", "REJECTED"].includes(c.status),
  );
  const approved = active.some((c) => c.status === "APPROVED");
  const closed = ["CLAIMED", "ARCHIVED"].includes(report.status);
  const canMessage = ["OPEN", "MATCHED"].includes(report.status);
  const browse = `/admin/reports?type=${lost ? "found" : "lost"}`;
  const awaitingStudent = history.some(
    (h) =>
      h.action === "REPORT_MATCH_INVITATION" &&
      available.some((m) => m.id === h.details?.matchedReportId),
  );
  const next = closed
    ? {
        title: "This report is closed",
        body: "Review recorded decisions and case history below.",
        href: "#case-history",
        action: "View case history",
      }
    : approved
      ? {
          title: "Ready for collection",
          body: "Verify the student's school ID and ownership. Record collection only after handing over the item.",
          href: "#case-requests",
          action: "Record collection",
        }
      : active.length
        ? {
            title: "Review ownership evidence",
            body: "Compare the student's answers with the item's private identifying details before approving collection.",
            href: "#case-requests",
            action: `Review requests (${active.length})`,
          }
        : claims.some((c) => c.status === "RELEASED")
          ? {
              title: "Collection recorded",
              body: "A related item was handed over. Review the collection record and case history below.",
              href: "#case-requests",
              action: "View collection record",
            }
          : awaitingStudent
            ? {
                title: "Waiting for the student's ownership request",
                body: "The student has been notified in Updates. They must inspect the suggested item and submit ownership evidence before collection can be approved.",
                href: "#case-matches",
                action: "View notified matches",
              }
            : available.length
              ? {
                  title: "Compare possible matches",
                  body: "Compare reports below. A matching color or location is a clue, not proof of ownership.",
                  href: "#case-matches",
                  action: "Compare items",
                }
              : {
                  title: "Waiting for a matching report",
                  body: "No available automatic matches. Browse other reports or keep this report open while waiting.",
                  href: browse,
                  action: `Browse ${lost ? "found" : "lost"} reports`,
                };
  const timeline = [
    {
      title: "Report submitted",
      at: report.createdAt,
      note: report.reporterName,
    },
    ...claims.map((c) => ({
      title: `Ownership request submitted · ${c.title}`,
      at: c.createdAt,
      note: c.claimantName,
    })),
    ...history
      .filter((h) => events[h.action])
      .map((h) => ({
        title: events[h.action],
        at: h.createdAt,
        note: h.details?.notes ?? "",
      })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return (
    <main className="page admin-case">
      <Link href={`/admin/reports?type=${lost ? "lost" : "found"}`}>
        ← Back to {lost ? "lost" : "found"} reports
      </Link>
      <header className="page-heading">
        <div>
          <span className="eyebrow">
            {lost ? "Student lost-item report" : "Found-item report"}
          </span>
          <h1>{report.title}</h1>
          <span className="status status--open">{label(report.status)}</span>
        </div>
      </header>
      <section className="panel admin-case-next">
        <div>
          <span className="eyebrow">Next step</span>
          <h2>{next.title}</h2>
          <p>{next.body}</p>
        </div>
        <Link className="button button--primary" href={next.href}>
          {next.action}
        </Link>
      </section>
      <div className="admin-case-grid">
        <section className="panel">
          <h2>Report summary</h2>
          {!!report.images.length && (
            <div className="admin-case-photos">
              {report.images.map((image, i) => (
                <a
                  key={image.storageKey}
                  href={photo(image.storageKey)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={photo(image.storageKey)}
                    alt={`${report.title}, photo ${i + 1} (opens full size)`}
                  />
                </a>
              ))}
            </div>
          )}
          <dl className="admin-case-facts">
            {Object.entries({
              Category: report.category,
              Color: report.color,
              Location: report.location,
              [lost ? "Date lost" : "Date found"]: date(report.occurredAt),
              "Submitted by": report.reporterName,
              "School ID": report.schoolId,
            }).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value || "Not provided"}</dd>
              </div>
            ))}
          </dl>
          <p>
            <a href={`mailto:${report.reporterEmail}`}>
              {report.reporterEmail}
            </a>
          </p>
          <h3>Public description</h3>
          <p>{report.publicDescription || "No public description provided."}</p>
          <div className="admin-case-private">
            <h3>Identifying details · Staff only</h3>
            <p>
              {report.privateVerificationDetails ||
                "Identifying details are missing. Ask for details only the owner would know before approving a claim."}
            </p>
            {!report.privateVerificationDetails && canMessage && (
              <CaseMessageForm
                id={id}
                sent={history.some(
                  (h) => h.action === "REPORT_DETAILS_REQUESTED",
                )}
              />
            )}
          </div>
        </section>
        <section className="panel" id="case-matches">
          <div className="section-head">
            <h2>
              Possible {lost ? "found" : "lost"} items ({available.length})
            </h2>
            <Link href={browse}>Browse all reports</Link>
          </div>
          <p className="muted">
            Suggestions only. Check the actual item and ownership evidence.
          </p>
          {!available.length && (
            <p>
              No available matches yet. Returned or reserved items are listed
              separately below.
            </p>
          )}
          {available.map((match) => (
            <article className="admin-case-match" key={match.id}>
              <div className="admin-case-match-heading">
                {match.storageKey && (
                  <img src={photo(match.storageKey)} alt={match.title} />
                )}
                <div>
                  <h3>
                    <Link href={`/admin/reports/${match.id}`}>
                      {match.title} →
                    </Link>
                  </h3>
                  <span className="status status--open">
                    {label(match.reportStatus)}
                  </span>
                  <p>{match.location}</p>
                </div>
              </div>
              <p>
                Matching clues:{" "}
                {match.reasons.join(", ") || "Similar report details"}
              </p>
              <details>
                <summary>Compare items side by side</summary>
                <div className="admin-case-table">
                  <table>
                    <caption>Report comparison</caption>
                    <thead>
                      <tr>
                        <th scope="col">Detail</th>
                        <th scope="col">This report</th>
                        <th scope="col">Possible match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Category", report.category, match.category],
                        ["Color", report.color, match.color],
                        ["Location", report.location, match.location],
                        [
                          "Date",
                          date(report.occurredAt),
                          date(match.occurredAt),
                        ],
                        [
                          "Description",
                          report.publicDescription,
                          match.description,
                        ],
                      ].map(([key, a, b]) => (
                        <tr key={key}>
                          <th scope="row">{key}</th>
                          <td>{a || "Not provided"}</td>
                          <td>{b || "Not provided"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
              {lost &&
                canMessage &&
                (claims.some(
                  (c) => c.reportId === match.id && c.status !== "REJECTED",
                ) ? (
                  <Link
                    className="button button--secondary"
                    href="#case-requests"
                  >
                    View related ownership request
                  </Link>
                ) : (
                  <CaseMessageForm
                    id={id}
                    matchId={match.id}
                    sent={history.some(
                      (h) =>
                        h.action === "REPORT_MATCH_INVITATION" &&
                        h.details?.matchedReportId === match.id,
                    )}
                  />
                ))}
            </article>
          ))}
          {!!unavailable.length && (
            <details className="admin-case-unavailable">
              <summary>
                Unavailable / resolved matches ({unavailable.length})
              </summary>
              {unavailable.map((m) => (
                <article key={m.id}>
                  <h3>
                    <Link href={`/admin/reports/${m.id}`}>{m.title} →</Link>
                  </h3>
                  <p>
                    {label(m.reportStatus)} ·{" "}
                    {m.reportStatus === "CLAIMED"
                      ? "Already returned; cannot be collected again."
                      : "Not available for a new ownership request."}
                  </p>
                </article>
              ))}
            </details>
          )}
        </section>
      </div>
      <section className="panel" id="case-requests">
        <div className="section-head">
          <h2>Ownership requests for this case ({claims.length})</h2>
          <Link href="/admin/claims">View all requests</Link>
        </div>
        {!claims.length && (
          <p>
            No related ownership request yet.{" "}
            {lost
              ? "After identifying an available match, invite the student to open that found item and submit proof."
              : "Students can submit proof from this found item's page."}{" "}
            Reporting a lost item does not create an ownership request.
          </p>
        )}
        {claims.map((c) => (
          <article className="admin-case-match" key={c.id} id={`claim-${c.id}`}>
            <h3>
              {c.title} · {c.claimantName}
            </h3>
            <p>
              <strong>{c.status.replaceAll("_", " ")}</strong> · Submitted{" "}
              {date(c.createdAt)}
            </p>
            <h4>Ownership evidence</h4>
            <p>
              {c.ownershipAnswers?.claimantStatement || "No statement provided"}
            </p>
            {c.ownershipAnswers?.additionalInformation?.map((info, i) => (
              <p key={i}>{info}</p>
            ))}
            {c.reviewNotes && <p>Last staff message: {c.reviewNotes}</p>}
            <ClaimReviewForm
              key={`${c.id}-${c.status}`}
              id={c.id}
              status={c.status}
            />
          </article>
        ))}
      </section>
      <section className="panel" id="case-history">
        <h2>Case history</h2>
        <ol className="admin-case-timeline">
          {timeline.map((event, i) => (
            <li key={`${event.at}-${i}`}>
              <strong>{event.title}</strong>
              <time dateTime={event.at}>
                {new Date(event.at).toLocaleString("en-PH", {
                  timeZone: "Asia/Manila",
                })}{" "}
                (PH)
              </time>
              {event.note && <p>{event.note}</p>}
            </li>
          ))}
        </ol>
      </section>
      <details className="panel">
        <summary>How the return process works</summary>
        <ol className="admin-next-steps">
          <li>Compare available reports and private identifying details.</li>
          <li>
            For a likely match, notify the student in Updates. They must submit
            an ownership request from the found item's page.
          </li>
          <li>
            Review evidence. Ask for information, approve collection, or decline
            with a reason.
          </li>
          <li>
            After approval, the student receives pickup instructions. Verify
            their school ID and record collection only after handover.
          </li>
        </ol>
        <p>
          A found report does not confirm physical custody. Confirm where the
          item is held before approving pickup.
        </p>
      </details>
    </main>
  );
}
