import { SearchResultsSkeleton } from "@/components/search-results-skeleton";
export default function SearchLoading() {
  return (
    <main className="portal-content portal-content--inner found-search-page">
      <div className="found-search-intro">
        <span className="eyebrow">I lost something</span>
        <h1>Could one of these be yours?</h1>
        <p>Loading found items…</p>
      </div>
      <SearchResultsSkeleton />
    </main>
  );
}
