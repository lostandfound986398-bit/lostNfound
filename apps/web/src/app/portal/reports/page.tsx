import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { ItemReportSummary } from "@lost-found/contracts";

async function getMyReports(): Promise<ItemReportSummary[]> { const supabase = await createClient(); const { data } = await supabase.auth.getSession(); if (!data.session?.access_token) return []; const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/mine`, { headers: { authorization: `Bearer ${data.session.access_token}` }, cache: "no-store" }); return response.ok ? await response.json() as ItemReportSummary[] : []; }
export default async function MyReportsPage() {
  const reports = await getMyReports();
  return <main className="portal-content portal-content--inner"><div className="portal-title"><div><span className="eyebrow">My activity</span><h1>My item reports</h1><p>Track report status and review suggested matches.</p></div><Link className="button button--primary" href="/portal/report/lost"><Plus size={17} /> New report</Link></div>
    <section className="panel table-panel"><div className="table-scroll"><table className="data-table"><thead><tr><th>Item</th><th>Type</th><th>Location</th><th>Status</th><th>Submitted</th><th></th></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td><b>{report.title}</b><small>{report.category} · {report.color}</small></td><td>{report.type}</td><td>{report.location}</td><td><span className={`status ${report.status === "OPEN" ? "status--open" : report.status === "MATCHED" ? "status--matched" : "status--pending"}`}>{report.status.replace("_", " ")}</span></td><td>{new Date(report.occurredAt).toLocaleDateString()}</td><td><button className="table-link"><Eye size={15} /> View</button></td></tr>)}</tbody></table></div></section>
  </main>;
}
