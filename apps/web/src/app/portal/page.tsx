import Link from "next/link";
import {
  ArrowRight,
  Bell,
  ClipboardList,
  PackageOpen,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { ItemReportSummary } from "@lost-found/contracts";
import { portalData } from "@/lib/portal";
import { ItemCard } from "@/components/item-card";
import { LoadError, PortalFeedback } from "@/components/portal-feedback";

export default async function UserPortal() {
  const [reports, myReports, myClaims, updateCount] = await Promise.all([
    portalData<ItemReportSummary[]>("/reports?type=FOUND"),
    portalData<{ status: string }[]>("/reports/mine"),
    portalData<{ status: string }[]>("/claims/mine"),
    portalData<{ unread: number }>("/reports/updates/count"),
  ]);

  return (
    <main className="portal-content student-dashboard">
      <section className="student-dashboard__hero">
        <div className="student-dashboard__intro">
          <span className="eyebrow eyebrow--light">Student dashboard</span>
          <h1>What do you need help with?</h1>
          <p>Find what’s missing. Help return what’s found.</p>
        </div>
      </section>

      <Link className="dashboard-search" href="/portal/search">
        <span className="dashboard-search__icon">
          <Search size={24} aria-hidden="true" />
        </span>
        <span>
          <small>Search found items · Start here</small>
          <strong>Search for your lost item</strong>
          <span>Check if your item has already been found.</span>
        </span>
        <ArrowRight size={20} aria-hidden="true" />
      </Link>

      <section
        className="student-dashboard__start"
        aria-label="Lost and found actions"
      >
        <div className="journey-choices student-journey-choices">
          <Link className="journey-choice" href="/portal/search">
            <span className="journey-choice__icon">
              <Search size={28} aria-hidden="true" />
            </span>
            <span className="journey-choice__copy">
              <small>Search first</small>
              <h2>I lost something</h2>
              <p>Search first, then report it if there’s no match.</p>
            </span>
            <span className="journey-choice__arrow" aria-hidden="true">
              <ArrowRight size={22} />
            </span>
          </Link>
          <Link className="journey-choice" href="/portal/report/found">
            <span className="journey-choice__icon">
              <PackageOpen size={28} aria-hidden="true" />
            </span>
            <span className="journey-choice__copy">
              <small>Help return it</small>
              <h2>I found something</h2>
              <p>Help return an item to its owner.</p>
            </span>
            <span className="journey-choice__arrow" aria-hidden="true">
              <ArrowRight size={22} />
            </span>
          </Link>
        </div>
      </section>

      <section
        className="student-dashboard__activity"
        aria-labelledby="activity-heading"
      >
        <div className="student-section-heading student-section-heading--row">
          <h2 id="activity-heading">Your activity</h2>
          <Link className="student-section-link" href="/portal/activity">
            View all <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="student-dashboard__summary">
          <Link href="/portal/reports">
            <ClipboardList size={18} aria-hidden="true" />
            <span>
              <strong>{myReports?.length ?? "—"}</strong>
              <small>My reports</small>
            </span>
          </Link>
          <Link href="/portal/claims">
            <ShieldCheck size={18} aria-hidden="true" />
            <span>
              <strong>{myClaims?.length ?? "—"}</strong>
              <small>Requests</small>
            </span>
          </Link>
          <Link href="/portal/updates">
            <Bell size={18} aria-hidden="true" />
            <span>
              <strong>{updateCount?.unread ?? "—"}</strong>
              <small>Unread updates</small>
            </span>
          </Link>
        </div>
      </section>

      <section
        className="student-dashboard__recent"
        aria-labelledby="recent-heading"
      >
        <div className="student-section-heading student-section-heading--row">
          <div>
            <span className="eyebrow">Latest listings</span>
            <h2 id="recent-heading">Recently found items</h2>
          </div>
          <Link className="student-section-link" href="/portal/search">
            Browse all <ArrowRight size={17} aria-hidden="true" />
          </Link>
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
