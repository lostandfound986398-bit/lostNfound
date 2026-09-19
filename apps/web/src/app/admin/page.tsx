import Link from "next/link";
import { BellRing, CircleCheckBig, Package, SearchCheck, Users } from "lucide-react";
import { authenticatedApi } from "@/lib/api/authenticated";

const stats = [
  { label: "Open lost reports", value: "24", trend: "+8% this month", icon: SearchCheck },
  { label: "Found items", value: "18", trend: "+3 this week", icon: Package },
  { label: "Pending claims", value: "7", trend: "Needs attention", icon: CircleCheckBig },
  { label: "Registered users", value: "842", trend: "+21 this month", icon: Users },
];

const activity = [
  { title: "Black leather wallet", detail: "Found · Main Library", status: "matched" },
  { title: "Blue Hydro Flask", detail: "Lost · CBEA Hall", status: "open" },
  { title: "Samsung Galaxy phone", detail: "Claim by Maria S.", status: "pending" },
  { title: "Student identification card", detail: "Found · Room 204", status: "open" },
];

interface Dashboard { lost: string; found: string; claims: string; users: string; recent: { id: string; title: string; type: string; status: string; location: string }[] }
async function getDashboard(): Promise<Dashboard | null> { const response = await authenticatedApi("/admin/dashboard"); return response?.ok ? await response.json() as Dashboard : null; }
export default async function AdminDashboard() {
  const dashboard = await getDashboard();
  const stats = dashboard ? [
    { label: "Open lost reports", value: dashboard.lost, trend: "Live total", icon: SearchCheck }, { label: "Found items", value: dashboard.found, trend: "Live total", icon: Package }, { label: "Pending claims", value: dashboard.claims, trend: "Needs attention", icon: CircleCheckBig }, { label: "Registered users", value: dashboard.users, trend: "Active accounts", icon: Users },
  ] : [];
  const activity = dashboard?.recent ?? [];
  return (
    <main className="page">
      <div className="page-heading">
        <div><span className="eyebrow">Saturday, August 1</span><h1>Good evening, Admin</h1><p>Here is what is happening across the lost-and-found system.</p></div>
        <Link className="button button--primary" href="/admin/reports">Review recent reports</Link>
      </div>
      <section className="stat-grid" aria-label="System summary">
        {stats.map(({ label, value, trend, icon: Icon }) => (
          <article className="stat-card" key={label}>
            <div className="stat-card__top"><div><small>{label}</small><strong>{value}</strong></div><span className="stat-icon"><Icon size={19} /></span></div>
            <span className="trend">{trend}</span>
          </article>
        ))}
      </section>
      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel__head"><h2>Report activity</h2><Link href="/admin/analytics">View analytics</Link></div>
          <div className="bars" aria-label="Lost and found reports from February through August">
            {[[45,62],[58,48],[36,43],[55,57],[43,66],[34,74],[39,82]].map(([lost, found], index) => (
              <div className="bar-pair" key={index}><span className="bar" style={{ height: `${lost}%` }} /><span className="bar bar--found" style={{ height: `${found}%` }} /><small>{["Feb","Mar","Apr","May","Jun","Jul","Aug"][index]}</small></div>
            ))}
          </div>
        </article>
        <article className="panel">
          <div className="panel__head"><h2>Recent activity</h2><Link href="/admin/reports">View all</Link></div>
          <div className="activity-list">
            {activity.map((item) => (
              <div className="activity-item" key={item.id}>
                <span className="activity-item__icon"><BellRing size={16} /></span>
                <span><strong>{item.title}</strong><small>{item.type} · {item.location}</small></span>
                <span className={`status status--${item.status === "OPEN" ? "open" : "matched"}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
