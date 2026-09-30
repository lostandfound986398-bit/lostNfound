import Link from "next/link";
import { SearchX } from "lucide-react";
import type { ItemReportSummary } from "@lost-found/contracts";
import { portalData } from "@/lib/portal";
import { ItemCard } from "@/components/item-card";
import {
  SearchFilters,
  type FoundItemFilters,
} from "@/components/search-filters";
import { LoadError, PortalFeedback } from "@/components/portal-feedback";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: FoundItemFilters = {
    q: "",
    category: "",
    location: "",
    dateFrom: "",
    dateTo: "",
  };
  for (const key of Object.keys(filters) as (keyof FoundItemFilters)[]) {
    const value = params[key];
    if (typeof value === "string") filters[key] = value.trim();
  }
  for (const key of ["dateFrom", "dateTo"] as const)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(filters[key])) filters[key] = "";
  const query = new URLSearchParams({ type: "FOUND" });
  for (const [key, value] of Object.entries(filters))
    if (value)
      query.set(key, key === "dateTo" ? `${value}T23:59:59.999` : value);
  const [reports, options, claims] = await Promise.all([
    portalData<ItemReportSummary[]>(`/reports?${query}`),
    portalData<{ categories: string[]; locations: string[] }>(
      "/reports/options",
    ),
    portalData<{ reportId: string; status: string; createdAt: string }[]>(
      "/claims/mine",
    ),
  ]);
  const ownClaims = new Map<string, string>();
  for (const claim of [...(claims ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  ))
    if (!ownClaims.has(claim.reportId))
      ownClaims.set(claim.reportId, claim.status);
  return (
    <main className="portal-content portal-content--inner found-search-page">
      <div className="found-search-intro">
        <span className="eyebrow">I lost something</span>
        <h1>Could one of these be yours?</h1>
        <p>
          Open an item to check the details. If it looks like yours, send staff
          an ownership request.
        </p>
      </div>
      <SearchFilters
        filters={filters}
        options={options}
        resultCount={reports?.length ?? null}
      >
        {reports === null ? (
          <LoadError href="/portal/search" />
        ) : reports.length === 0 ? (
          <PortalFeedback title="No matching items found.">
            <SearchX size={36} aria-hidden="true" />
            <p>
              Try changing your search or filters. If you still can’t find your
              item, you can create a lost-item report.
            </p>
            <Link className="button button--primary" href="/portal/report/lost">
              Create Lost Report
            </Link>
          </PortalFeedback>
        ) : (
          <>
            {claims === null && (
              <p role="status" className="muted">
                Ownership updates are unavailable. Open an item to check your
                request status.
              </p>
            )}
            <div className="item-grid">
              {reports.map((report) => (
                <ItemCard
                  key={report.id}
                  report={report}
                  ownershipStatus={ownClaims.get(report.id)}
                />
              ))}
            </div>
            <section className="panel search-next-step">
              <h2>Still haven’t found your item?</h2>
              <p>If none of these match, let staff know what to look for.</p>
              <Link
                className="button button--secondary"
                href="/portal/report/lost"
              >
                Create Lost Report
              </Link>
            </section>
          </>
        )}
      </SearchFilters>
    </main>
  );
}
