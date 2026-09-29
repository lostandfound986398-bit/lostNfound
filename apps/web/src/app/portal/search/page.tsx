import Link from "next/link";
import type { ItemReportSummary } from "@lost-found/contracts";
import { portalData } from "@/lib/portal";
import { ItemCard } from "@/components/item-card";
import { SearchFilters } from "@/components/search-filters";
import { LoadError, PortalFeedback } from "@/components/portal-feedback";

type Filters = {
  q?: string;
  category?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
};
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  const filters = await searchParams;
  const appliedFilters = Object.entries(filters).filter(
    ([key, value]) =>
      ["q", "category", "location", "dateFrom", "dateTo"].includes(key) &&
      value,
  );
  const filterLabels: Record<string, string> = {
    q: "Search",
    category: "Category",
    location: "Location",
    dateFrom: "From",
    dateTo: "Until",
  };
  function withoutFilter(key: string) {
    const remaining = new URLSearchParams(
      appliedFilters.filter(([name]) => name !== key) as [string, string][],
    );
    return `/portal/search${remaining.size ? `?${remaining}` : ""}`;
  }
  const query = new URLSearchParams({ type: "FOUND" });
  for (const key of [
    "q",
    "category",
    "location",
    "dateFrom",
    "dateTo",
  ] as const)
    if (filters[key])
      query.set(
        key,
        key === "dateTo" && /^\d{4}-\d{2}-\d{2}$/.test(filters[key])
          ? `${filters[key]}T23:59:59.999`
          : filters[key],
      );
  const [reports, options] = await Promise.all([
    portalData<ItemReportSummary[]>(`/reports?${query}`),
    portalData<{ categories: string[]; locations: string[] }>(
      "/reports/options",
    ),
  ]);
  return (
    <main className="portal-content portal-content--inner">
      <div className="portal-title">
        <div>
          <span className="eyebrow">I lost something</span>
          <h1>Could one of these be yours?</h1>
          <p>
            Open an item to check the details. If it looks like yours, send
            staff an ownership request.
          </p>
        </div>
        <Link className="button button--secondary" href="/portal/report/lost">
          Report my missing item
        </Link>
      </div>
      <form className="panel journey-search" action="/portal/search">
        <label>
          What did you lose?
          <input
            className="form-control"
            name="q"
            defaultValue={filters.q}
            placeholder="Try wallet, phone, or keys"
          />
        </label>
        <SearchFilters
          count={appliedFilters.filter(([key]) => key !== "q").length}
        >
          <div className="journey-filter-grid">
            <label>
              Category
              <select name="category" defaultValue={filters.category ?? ""}>
                <option value="">All categories</option>
                {Array.from(
                  new Set([
                    ...(options?.categories ?? []),
                    ...(filters.category ? [filters.category] : []),
                  ]),
                ).map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Location
              <select name="location" defaultValue={filters.location ?? ""}>
                <option value="">All locations</option>
                {Array.from(
                  new Set([
                    ...(options?.locations ?? []),
                    ...(filters.location ? [filters.location] : []),
                  ]),
                ).map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Found from
              <input
                type="date"
                name="dateFrom"
                defaultValue={filters.dateFrom}
              />
            </label>
            <label>
              Found until
              <input type="date" name="dateTo" defaultValue={filters.dateTo} />
            </label>
          </div>
        </SearchFilters>
        {options === null && (
          <p role="status">
            Category and location options are unavailable. You can still search
            by name or date.
          </p>
        )}
        <div className="journey-actions">
          <button className="button button--primary">Search found items</button>
          <Link href="/portal/search">Clear filters</Link>
        </div>
      </form>
      {appliedFilters.length > 0 && (
        <nav className="filter-chips" aria-label="Applied filters">
          {appliedFilters.map(([key, value]) => (
            <Link
              key={key}
              href={withoutFilter(key)}
              aria-label={`Remove ${filterLabels[key]} filter: ${value}`}
            >
              {filterLabels[key]}: {value}
              <span aria-hidden="true"> ×</span>
            </Link>
          ))}
        </nav>
      )}
      {reports === null ? (
        <LoadError href={`/portal/search?${query}`} />
      ) : reports.length === 0 ? (
        <PortalFeedback title="No items match your search">
          <p>
            Try fewer filters, or report your missing item so staff know what to
            look for.
          </p>
          <Link className="button button--primary" href="/portal/report/lost">
            Report my missing item
          </Link>
        </PortalFeedback>
      ) : (
        <>
          <p>
            {reports.length} item{reports.length === 1 ? "" : "s"} found
          </p>
          <div className="item-grid">
            {reports.map((report) => (
              <ItemCard key={report.id} report={report} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
