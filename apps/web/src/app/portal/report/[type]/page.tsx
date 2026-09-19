import { notFound } from "next/navigation";
import { Info, MapPin } from "lucide-react";
import { ReportFormClient } from "@/components/report-form-client";

interface ReportOptions { categories: string[]; locations: string[] }

async function getReportOptions(): Promise<ReportOptions> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reports/options`, { cache: "no-store" });
    if (response.ok) return (await response.json()) as ReportOptions;
  } catch {}
  return { categories: [], locations: [] };
}

export default async function ReportItemPage({ params }: { params: Promise<{ type: string }> }) {
  const type = (await params).type;
  if (type !== "lost" && type !== "found") notFound();
  const lost = type === "lost";
  const { categories, locations } = await getReportOptions();

  return (
    <main className="portal-content portal-content--inner">
      <div className="report-form-layout">
        <section>
          <span className="eyebrow">New {type} report</span>
          <h1>{lost ? "What did you lose?" : "What did you find?"}</h1>
          <p className="muted">Accurate details improve automatic matching. Keep private identifying information in the ownership field.</p>
          <ReportFormClient type={type as "lost" | "found"} categories={categories} locations={locations} />
        </section>
        <aside className="report-help">
          <MapPin size={24} />
          <h2>Help us find a match</h2>
          <p>Choose the closest campus location and date. The system compares category, color, location, date, and description.</p>
          <div>
            <Info size={17} />
            <span>Never put phone numbers, passwords, or highly private details in the public description.</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

