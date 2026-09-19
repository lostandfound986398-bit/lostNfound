import Link from "next/link";
import { FilePlus2, PackageOpen, Search, ShieldCheck, WalletCards } from "lucide-react";
import type { ItemReportSummary } from "@lost-found/contracts";
import { createClient } from "@/lib/supabase/server";

async function getRecentFoundReports(): Promise<ItemReportSummary[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports?type=FOUND`, { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as ItemReportSummary[];
      return data.slice(0, 6);
    }
  } catch {}
  return [];
}

export default async function UserPortal() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const displayName = userData?.user?.user_metadata?.full_name || userData?.user?.email?.split("@")[0] || "Student";

  const recentReports = await getRecentFoundReports();

  return (
    <main>
      <div className="portal-content">
        <section className="hero-copy">
          <span className="eyebrow">Welcome back, {displayName}</span>
          <h1>What are you looking for?</h1>
          <p>Search verified campus reports using an item name, color, category, or location. We will show the safest possible matches.</p>
        </section>

        <form action="/portal/search" className="finder" method="GET">
          <label>
            <Search size={20} />
            <input aria-label="Search lost and found reports" name="q" placeholder="Try “brown wallet near the library”" />
          </label>
          <button className="button button--primary" type="submit">Search reports</button>
        </form>

        <section className="quick-actions" aria-label="Quick actions">
          <Link className="quick-card" href="/portal/report/lost">
            <span className="quick-card__icon"><Search size={20} /></span>
            <span><strong>Report a lost item</strong><small>Tell us what went missing and where.</small></span>
          </Link>
          <Link className="quick-card" href="/portal/report/found">
            <span className="quick-card__icon"><PackageOpen size={20} /></span>
            <span><strong>Report a found item</strong><small>Help return something you discovered.</small></span>
          </Link>
          <Link className="quick-card" href="/portal/reports">
            <span className="quick-card__icon"><FilePlus2 size={20} /></span>
            <span><strong>Track my reports</strong><small>Review matches, claims, and updates.</small></span>
          </Link>
        </section>

        <section>
          <div className="section-head">
            <h2>Recently found on campus</h2>
            <Link href="/portal/search">View all reports</Link>
          </div>

          {recentReports.length === 0 ? (
            <p className="muted" style={{ padding: "1.5rem 0" }}>No found item reports have been posted yet.</p>
          ) : (
            <div className="item-grid">
              {recentReports.map((report) => (
                <article className="item-card" key={report.id}>
                  <div className="item-card__visual">
                    {report.imageUrl ? (
                      <img src={report.imageUrl} alt={report.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <WalletCards size={54} strokeWidth={1.35} />
                    )}
                  </div>
                  <div className="item-card__body">
                    <div className="item-card__meta">
                      <span className="status status--matched">Found</span>
                      <span className="muted">{new Date(report.occurredAt).toLocaleDateString()}</span>
                    </div>
                    <h3>{report.title}</h3>
                    <p>{report.category} · {report.location}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="info-box">
          <ShieldCheck size={20} />
          <span>For your safety, contact information and private identifying details are never shown in public results.</span>
        </div>
      </div>
    </main>
  );
}
