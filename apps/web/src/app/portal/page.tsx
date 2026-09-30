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
          <h1>What do you need help with today?</h1>
          <p>
            Search for something you lost, report an item you found, and keep
            track of every update in one place.
          </p>
        </div>
        <div
          className="student-dashboard__summary"
          aria-label="Your activity summary"
        >
          <Link href="/portal/reports">
            <ClipboardList size={20} aria-hidden="true" />
            <span>
              <strong>{myReports?.length ?? "—"}</strong>
              <small>My reports</small>
            </span>
          </Link>
          <Link href="/portal/claims">
            <ShieldCheck size={20} aria-hidden="true" />
            <span>
              <strong>{myClaims?.length ?? "—"}</strong>
              <small>Requests</small>
            </span>
          </Link>
          <Link href="/portal/updates">
            <Bell size={20} aria-hidden="true" />
            <span>
              <strong>{updateCount?.unread ?? "—"}</strong>
              <small>Unread updates</small>
            </span>
          </Link>
        </div>
      </section>

      <section
        className="student-dashboard__start"
        aria-labelledby="start-heading"
      >
        <div className="student-section-heading">
          <div>
            <span className="eyebrow">Start here</span>
            <h2 id="start-heading">Choose what happened</h2>
          </div>
          <p>We’ll guide you through the right next step.</p>
        </div>
        <div className="journey-choices student-journey-choices">
          <Link className="journey-choice" href="/portal/search">
            <span className="journey-choice__icon">
              <Search size={28} aria-hidden="true" />
            </span>
            <span className="journey-choice__copy">
              <small>Search first</small>
              <h3>I lost something</h3>
              <p>
                Check recently found items. If yours is not listed, create a
                missing-item report.
              </p>
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
              <h3>I found something</h3>
              <p>
                Record where and when you found it so the owner can recognize
                it.
              </p>
            </span>
            <span className="journey-choice__arrow" aria-hidden="true">
              <ArrowRight size={22} />
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
