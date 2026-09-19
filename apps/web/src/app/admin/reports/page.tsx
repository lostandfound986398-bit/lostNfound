import Link from "next/link";
import { Backpack, Eye, KeyRound, Plus, Search, Smartphone, WalletCards } from "lucide-react";
import type { ItemReportSummary } from "@lost-found/contracts";
import { AdminPageHeader, FilterBar } from "@/components/admin-page";

async function getLiveReports(type: string): Promise<ItemReportSummary[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";
    const response = await fetch(`${baseUrl}/api/v1/reports?type=${type.toUpperCase()}`, {
      cache: "no-store",
    });
    if (response.ok) return (await response.json()) as ItemReportSummary[];
  } catch {}
  return [];
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const currentType = params.type === "found" ? "found" : "lost";
  const reports = await getLiveReports(currentType);

  const title = currentType === "lost" ? "Lost item reports" : "Found item reports";

  return (
    <main className="page">
      <AdminPageHeader
        eyebrow="Item management"
        title={title}
        description={`Review, update, and monitor every ${currentType} item submitted to the system.`}
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
            <Link className="button button--primary" href={`/portal/report/${currentType}`}>
              <Plus size={17} /> Add {currentType} report
            </Link>
          </div>
        }
      />

      <FilterBar>
        <span>{reports.length} live report{reports.length === 1 ? "" : "s"}</span>
      </FilterBar>

      <div className="management-layout" style={{ gridTemplateColumns: "1fr" }}>
        {reports.length === 0 ? (
          <section className="panel" style={{ padding: "3rem 1.5rem", textAlign: "center" }}>
            <p className="muted">No live {currentType} reports found.</p>
          </section>
        ) : (
          <section className="admin-card-grid">
            {reports.map((report) => {
              const status = report.status;
              const statusClass =
                status === "OPEN" ? "status--open" : status === "MATCHED" ? "status--matched" : "status--pending";

              return (
                <article className="management-card" key={report.id}>
                  <div className="management-card__visual">
                    {report.imageUrl ? (
                      <img
                        src={report.imageUrl}
                        alt={report.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Search size={56} strokeWidth={1.25} />
                    )}
                    <span className={`status ${statusClass}`}>{status.replace("_", " ")}</span>
                  </div>
                  <div className="management-card__body">
                    <small>{report.category}</small>
                    <h2>{report.title}</h2>
                    <dl>
                      <div>
                        <dt>Location</dt>
                        <dd>{report.location}</dd>
                      </div>
                      <div>
                        <dt>Date</dt>
                        <dd>{new Date(report.occurredAt).toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt>Color</dt>
                        <dd>{report.color}</dd>
                      </div>
                    </dl>
                    <div className="card-actions">
                      <Link href={`/portal/search?q=${encodeURIComponent(report.title)}`}>
                        <button aria-label={`View ${report.title}`}>
                          <Eye size={16} /> View
                        </button>
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
