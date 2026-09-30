export function SearchResultsSkeleton() {
  return (
    <div
      className="found-skeleton"
      role="status"
      aria-label="Loading found items"
    >
      <span className="sr-only">Loading found items…</span>
      {[0, 1, 2].map((index) => (
        <div className="found-skeleton__card" key={index} aria-hidden="true">
          <div className="found-skeleton__image" />
          <div className="found-skeleton__body">
            <span />
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}
