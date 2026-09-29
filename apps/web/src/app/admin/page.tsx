import Link from "next/link";
import {
  BellRing,
  CircleCheckBig,
  Package,
  SearchCheck,
  Users,
} from "lucide-react";
import { authenticatedApi } from "@/lib/api/authenticated";

interface Dashboard {
  lost: string;
  found: string;
  claims: string;
  users: string;
  recent: {
    id: string;
    title: string;
    type: string;
    status: string;
    location: string;
  }[];
}
async function getDashboard(): Promise<Dashboard | null> {
  try {
    const response = await authenticatedApi("/admin/dashboard");
    return response?.ok ? ((await response.json()) as Dashboard) : null;
  } catch {
    return null;
  }
}
export default async function AdminDashboard() {
  const dashboard = await getDashboard();
  const stats = dashboard
    ? [
        {
          label: "Open lost reports",
          value: dashboard.lost,
          trend: "Live total",
          icon: SearchCheck,
        },
        {
          label: "Found items",
          value: dashboard.found,
          trend: "Live total",
          icon: Package,
        },
        {
          label: "Pending claims",
          value: dashboard.claims,
          trend: "Needs attention",
          icon: CircleCheckBig,
        },
        {
          label: "Registered users",
          value: dashboard.users,
          trend: "Active accounts",
          icon: Users,
        },
      ]
    : [];
  const activity = dashboard?.recent ?? [];
  return (
    <main className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Staff workspace</span>
          <h1>What needs attention?</h1>
          <p>
            Review ownership requests, check reports, and record item handovers.
          </p>
        </div>
        <Link className="button button--primary" href="/admin/reports">
          Review recent reports
        </Link>
      </div>
      {!dashboard && (
        <div className="journey-message journey-message--error" role="alert">
          <h2>Dashboard information is unavailable</h2>
          <p>
            Try refreshing the page. Empty figures do not mean there are no
            reports.
          </p>
        </div>
      )}
      <section className="stat-grid" aria-label="System summary">
        {stats.map(({ label, value, trend, icon: Icon }) => (
          <article className="stat-card" key={label}>
            <div className="stat-card__top">
              <div>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
              <span className="stat-icon">
                <Icon size={19} />
              </span>
            </div>
            <span className="trend">{trend}</span>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel__head">
            <h2>Next tasks</h2>
          </div>
          <div className="journey-list">
            <Link className="journey-task" href="/admin/claims">
              <strong>
                Review ownership requests
                {dashboard ? ` (${dashboard.claims})` : ""} →
              </strong>
              <span>
                Compare the owner's answers with the item details before
                approving collection.
              </span>
            </Link>
            <Link className="journey-task" href="/admin/reports?type=found">
              <strong>Check found-item reports →</strong>
              <span>Review reported items and their current status.</span>
            </Link>
            <Link className="journey-task" href="/admin/claims">
              <strong>Record a collection →</strong>
              <span>
                For an approved request, verify the school ID and record the
                handover.
              </span>
            </Link>
          </div>
        </article>
        <article className="panel">
          <div className="panel__head">
            <h2>Recent activity</h2>
            <Link href="/admin/reports">View all</Link>
          </div>
          <div className="activity-list">
            {dashboard && activity.length === 0 && (
              <p>No reports have been submitted yet.</p>
            )}
            {activity.map((item) => (
              <div className="activity-item" key={item.id}>
                <span className="activity-item__icon">
                  <BellRing size={16} />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.type} · {item.location}
                  </small>
                </span>
                <span
                  className={`status status--${item.status === "OPEN" ? "open" : "matched"}`}
                >
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
