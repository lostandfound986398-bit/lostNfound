import { authenticatedApi } from "@/lib/api/authenticated";
import { notFound } from "next/navigation";
import { Info, MapPin } from "lucide-react";
import { ReportFormClient } from "@/components/report-form-client";

interface ReportOptions {
  categories: string[];
  locations: string[];
}

async function getReportOptions(): Promise<ReportOptions> {
  try {
    const response = await authenticatedApi("/reports/options");
    if (response?.ok) return (await response.json()) as ReportOptions;
  } catch {}
  return { categories: [], locations: [] };
}

export default async function ReportItemPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
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
          <p className="muted">
            Answer a few questions, add an optional photo, and check your report
            before sending it.
          </p>
          {categories.length && locations.length ? (
            <ReportFormClient
              type={type}
              categories={categories}
              locations={locations}
            />
          ) : (
            <div className="journey-message" role="alert">
              <h2>Reporting is not ready yet</h2>
              <p>
                Category and location choices are unavailable. Please try again
                later or contact staff.
              </p>
            </div>
          )}
        </section>
        <aside className="report-help">
          <MapPin size={24} />
          <h2>What happens next?</h2>
          <p>
            After submitting, follow progress in Items I reported. Use where the
            item was found or where you last remember having it.
          </p>
          <div>
            <Info size={17} />
            <span>
              Never put phone numbers, passwords, or highly private details in
              the public description.
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}
