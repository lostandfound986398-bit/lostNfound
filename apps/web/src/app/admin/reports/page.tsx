import Link from "next/link";
import { authenticatedApi } from "@/lib/api/authenticated";
import { Eye, Search } from "lucide-react";
import type { ItemReportSummary } from "@lost-found/contracts";
import { AdminPageHeader, FilterBar } from "@/components/admin-page";

async function getLiveReports(
  type: string,
): Promise<ItemReportSummary[] | null> {
  try {
    const response = await authenticatedApi(
      `/reports?type=${type.toUpperCase()}`,
    );
    if (response?.ok) return (await response.json()) as ItemReportSummary[];
  } catch {}
  return null;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const currentType = params.type === "found" ? "found" : "lost";
  const reports = await getLiveReports(currentType);

  const title =
    currentType === "lost" ? "Lost item reports" : "Found item reports";

  return (
    <main className="page">
      <AdminPageHeader
        eyebrow="Item management"
        title={title}
        description={
          currentType === "lost"
            ? "Open a report, compare possible found items, and help the student request collection."
            : "Open a report and compare ownership details before approving collection."
        }
        action={
          <div className="button-group">
            <Link
              className={`button ${currentType === "lost" ? "button--primary" : "button--ghost"}`}
              href="/admin/reports?type=lost"
            >
              Lost items
            </Link>
            <Link
              className={`button ${currentType === "found" ? "button--primary" : "button--ghost"}`}
              href="/admin/reports?type=found"
            >
              Found items
            </Link>
          </div>
        }
      />

      <FilterBar>
        <span>
          {reports === null
            ? "Reports unavailable"
            : `${reports.length} live report${reports.length === 1 ? "" : "s"}`}
        </span>
      </FilterBar>

      <div className="management-layout" style={{ gridTemplateColumns: "1fr" }}>
        {reports === null ? (
          <section
            className="journey-message journey-message--error"
            role="alert"
          >
            <h2>Reports could not be loaded</h2>
            <p>
              This does not mean no students have submitted reports. Check that
              the API is running and try again.
            </p>
            <Link href={`/admin/reports?type=${currentType}`}>Try again</Link>
          </section>
        ) : reports.length === 0 ? (
          <section
            className="panel"
            style={{ padding: "3rem 1.5rem", textAlign: "center" }}
          >
            <p className="muted">No live {currentType} reports found.</p>
          </section>
        ) : (
          <section className="admin-card-grid">
            {reports.map((report) => {
              const reportHref = `/admin/reports/${report.id}`;
              const status = report.status;
              const statusClass =
                status === "OPEN"
                  ? "status--open"
                  : status === "MATCHED"
                    ? "status--matched"
                    : "status--pending";

              return (
                <article className="management-card" key={report.id}>
                  <Link
                    className="management-card__visual"
                    href={reportHref}
                    aria-label={`Review ${report.title}`}
                  >
                    {report.imageUrl ? (
                      <img src={report.imageUrl} alt={report.title} />
                    ) : (
                      <Search size={56} strokeWidth={1.25} />
                    )}
                    <span className={`status ${statusClass}`}>
                      {status.replace("_", " ")}
                    </span>
                  </Link>
                  <div className="management-card__body">
                    <small>{report.category}</small>
                    <h2>
                      <Link
                        className="management-card__title-link"
                        href={reportHref}
                      >
                        {report.title}
                      </Link>
                    </h2>
                    <dl>
                      <div>
                        <dt>Location</dt>
                        <dd>{report.location}</dd>
                      </div>
                      <div>
                        <dt>Date</dt>
                        <dd>
                          {new Date(report.occurredAt).toLocaleDateString()}
                        </dd>
                      </div>
                      <div>
                        <dt>Color</dt>
                        <dd>{report.color}</dd>
                      </div>
                    </dl>
                    <div className="card-actions">
                      <Link
                        className="button button--secondary"
                        href={reportHref}
                        aria-label={`Review ${report.title}`}
                      >
                        <Eye size={16} /> Review report
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
