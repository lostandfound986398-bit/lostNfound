import Link from "next/link";
import { CheckCircle2, Search } from "lucide-react";
import type { ItemReportSummary } from "@lost-found/contracts";
import { submitClaim } from "@/app/actions/claims";

async function getReports(query: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";
    const response = await fetch(`${baseUrl}/api/v1/reports?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    return response.ok ? ((await response.json()) as ItemReportSummary[]) : [];
  } catch {
    return [];
  }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q ?? "";
  const results = (await getReports(q)).filter((report) => report.type === "FOUND");

  return (
    <main className="portal-content portal-content--inner">
      <div className="portal-title">
        <div>
          <span className="eyebrow">Verified campus listings</span>
          <h1>Search found items</h1>
          <p>Descriptions are intentionally limited until ownership is verified.</p>
        </div>
        <Link className="button button--primary" href="/portal/report/lost">
          Report lost item
        </Link>
      </div>

      <form className="finder finder--wide">
        <label>
          <Search size={20} />
          <input defaultValue={q} name="q" placeholder="Search by item, color, category, or location" />
        </label>
        <button className="button button--primary">Search</button>
      </form>

      <div className="portal-filters">
        <span>{results.length} result{results.length === 1 ? "" : "s"}</span>
      </div>

      <section className="item-grid item-grid--four">
        {results.map((report) => {
          const isClaimed = report.status === "CLAIMED";

          return (
            <article className="item-card" key={report.id}>
              <div className="item-card__visual">
                {report.imageUrl ? (
                  <img src={report.imageUrl} alt={report.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <Search size={54} strokeWidth={1.35} />
                )}
              </div>
              <div className="item-card__body">
                <div className="item-card__meta">
                  <span className={`status ${isClaimed ? "status--matched" : "status--open"}`}>
                    {isClaimed ? "Returned to Owner" : report.status.replace("_", " ")}
                  </span>
                  <span className="muted">{new Date(report.occurredAt).toLocaleDateString()}</span>
                </div>
                <h3>{report.title}</h3>
                <p>{report.category} · {report.color} · {report.location}</p>

                {isClaimed ? (
                  <div
                    style={{
                      background: "#dcfce7",
                      border: "1px solid #86efac",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      fontSize: "0.8rem",
                      color: "#166534",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "12px",
                    }}
                  >
                    <CheckCircle2 size={16} style={{ color: "#16a34a", flexShrink: 0 }} />
                    <span>Returned to rightful owner</span>
                  </div>
                ) : (
                  <form action={submitClaim}>
                    <input name="reportId" type="hidden" value={report.id} />
                    <input className="form-control" name="ownershipAnswer" placeholder="Describe proof of ownership" required />
                    <button className="button button--secondary button--full item-card__action">
                      Submit claim
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
