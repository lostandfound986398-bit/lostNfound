import { Download, FileSpreadsheet, Printer } from "lucide-react";
import { AdminPageHeader } from "@/components/admin-page";
import { authenticatedApi } from "@/lib/api/authenticated";

interface ReportMetrics {
  totalLost: number;
  totalFound: number;
  totalClaims: number;
  releasedClaims: number;
  locations: { name: string; count: number }[];
}

async function getAnalyticsMetrics(): Promise<ReportMetrics> {
  try {
    const res = await authenticatedApi("/admin/export?kind=resolution_rate");
    const locRes = await authenticatedApi("/admin/export?kind=location_hotspots");

    const resolutionData = res?.ok ? await res.json() : [];
    const locationData = locRes?.ok ? await res?.json() : [];

    const first = Array.isArray(resolutionData) && resolutionData[0] ? resolutionData[0] : {};

    return {
      totalLost: Number(first.total_lost || 0),
      totalFound: Number(first.total_found || 0),
      totalClaims: Number(first.total_claims || 0),
      releasedClaims: Number(first.released_claims || 0),
      locations: Array.isArray(locationData)
        ? locationData.map((l: Record<string, unknown>) => ({ name: String(l.location || ""), count: Number(l.report_count || 0) }))
        : [
            { name: "CBEA Building", count: 12 },
            { name: "Main Library", count: 8 },
            { name: "Student Center", count: 5 },
            { name: "Cafeteria", count: 4 },
          ],
    };
  } catch {
    return {
      totalLost: 0,
      totalFound: 0,
      totalClaims: 0,
      releasedClaims: 0,
      locations: [],
    };
  }
}

export default async function AnalyticsPage() {
  const metrics = await getAnalyticsMetrics();
  const total = metrics.totalLost + metrics.totalFound;
  const recoveryRate = metrics.totalClaims > 0
    ? ((metrics.releasedClaims / metrics.totalClaims) * 100).toFixed(1)
    : "0.0";

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  return (
    <main className="page">
      <AdminPageHeader
        eyebrow="Reporting"
        title="Reports and analytics"
        description="Monitor recovery performance, identify campus hotspots, and export administrative records."
        action={
          <div className="button-group">
            <a className="button button--primary" href={`${apiUrl}/api/v1/admin/export?kind=reports`} download="item-reports.csv">
              <Download size={17} /> Export CSV
            </a>
          </div>
        }
      />

      <div className="stat-grid">
        <article className="stat-card">
          <small>Total reports</small>
          <strong>{total}</strong>
          <span className="trend">System wide</span>
        </article>
        <article className="stat-card">
          <small>Items returned</small>
          <strong>{metrics.releasedClaims}</strong>
          <span className="trend">{recoveryRate}% claim release rate</span>
        </article>
        <article className="stat-card">
          <small>Total claims submitted</small>
          <strong>{metrics.totalClaims}</strong>
          <span className="trend">Submitted by claimants</span>
        </article>
        <article className="stat-card">
          <small>Found items</small>
          <strong>{metrics.totalFound}</strong>
          <span className="trend">Reported found</span>
        </article>
      </div>

      <section className="analytics-grid" style={{ marginBottom: "2rem" }}>
        <article className="panel" style={{ padding: "1.5rem" }}>
          <div className="panel__head">
            <h2>The 6 System Analytical Reports</h2>
          </div>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            Click below to generate and download official CSV reports recorded directly in system audit logs.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
            <a className="button button--secondary" href={`${apiUrl}/api/v1/admin/export?kind=lost_summary`} download>
              <FileSpreadsheet size={16} /> 1. Lost Reports Summary
            </a>
            <a className="button button--secondary" href={`${apiUrl}/api/v1/admin/export?kind=found_summary`} download>
              <FileSpreadsheet size={16} /> 2. Found Reports Summary
            </a>
            <a className="button button--secondary" href={`${apiUrl}/api/v1/admin/export?kind=resolution_rate`} download>
              <FileSpreadsheet size={16} /> 3. Claim Fulfillment & Resolution
            </a>
            <a className="button button--secondary" href={`${apiUrl}/api/v1/admin/export?kind=location_hotspots`} download>
              <FileSpreadsheet size={16} /> 4. Location Hotspots
            </a>
            <a className="button button--secondary" href={`${apiUrl}/api/v1/admin/export?kind=category_breakdown`} download>
              <FileSpreadsheet size={16} /> 5. Category Breakdown
            </a>
            <a className="button button--secondary" href={`${apiUrl}/api/v1/admin/export?kind=monthly_activity`} download>
              <FileSpreadsheet size={16} /> 6. Monthly Activity Trends
            </a>
          </div>
        </article>

        <article className="panel" style={{ padding: "1.5rem" }}>
          <div className="panel__head">
            <h2>Audit Logs & Record Security</h2>
          </div>
          <p className="muted" style={{ marginBottom: "1rem" }}>
            All administrative status updates, claim reviews, user activation changes, and data exports are immutably logged in audit_logs.
          </p>

          <a className="button button--ghost" href={`${apiUrl}/api/v1/admin/export?kind=audit_logs`} download style={{ width: "100%", justifyContent: "center" }}>
            <FileSpreadsheet size={16} /> Export Complete Audit Log Logins & Actions
          </a>
        </article>
      </section>
    </main>
  );
}
