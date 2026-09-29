import Link from "next/link";
export default function ItemNotFound() {
  return (
    <main className="portal-content">
      <div className="journey-message">
        <h1>This item isn't available</h1>
        <p>The link may be incorrect, or the report may have been removed.</p>
        <Link className="button button--primary" href="/portal/search">
          Browse found items
        </Link>
      </div>
    </main>
  );
}
