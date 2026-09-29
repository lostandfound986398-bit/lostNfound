import Link from "next/link";
import { Search, PackageOpen } from "lucide-react";
import type { ItemReportSummary } from "@lost-found/contracts";
import { portalData } from "@/lib/portal";
import { ItemCard } from "@/components/item-card";
import { LoadError, PortalFeedback } from "@/components/portal-feedback";

export default async function UserPortal() {
  const reports = await portalData<ItemReportSummary[]>("/reports?type=FOUND");
  return (
    <main className="portal-content">
      <section className="hero-copy">
        <span className="eyebrow">Campus lost and found</span>
        <h1>How can we help?</h1>
        <p>Choose what happened. We'll help you take the next step.</p>
      </section>
      <section className="journey-choices" aria-label="Start here">
        <Link className="journey-choice" href="/portal/search">
          <Search size={30} />
          <h2>I lost something</h2>
          <p>
            Look through found items. If yours isn't there, report it missing.
          </p>
          <strong>Look for my item →</strong>
        </Link>
        <Link className="journey-choice" href="/portal/report/found">
          <PackageOpen size={30} />
          <h2>I found something</h2>
          <p>Describe what you found so its owner can recognize it.</p>
          <strong>Report a found item →</strong>
        </Link>
      </section>
      <div className="journey-tracking">
        <span>Already submitted something?</span>
        <Link href="/portal/reports">Items I reported</Link>
        <Link href="/portal/claims">My ownership requests</Link>
      </div>
      <section>
        <div className="section-head">
          <h2>Recently found items</h2>
          <Link href="/portal/search">Browse all</Link>
        </div>
        {reports === null ? (
          <LoadError href="/portal" />
        ) : reports.length === 0 ? (
          <PortalFeedback title="No found items listed yet">
            <p>
              You can still report your missing item so there is a record of
              what to look for.
            </p>
            <Link href="/portal/report/lost">Report my missing item →</Link>
          </PortalFeedback>
        ) : (
          <div className="item-grid">
            {reports.slice(0, 6).map((report) => (
              <ItemCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
