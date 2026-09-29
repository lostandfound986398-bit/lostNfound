"use client";
export default function PortalError({ reset }: { reset: () => void }) {
  return (
    <main className="portal-content">
      <div className="journey-message journey-message--error" role="alert">
        <h2>We couldn't open this page</h2>
        <p>
          Please try again. This does not mean your reports have been removed.
        </p>
        <button className="button button--primary" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
