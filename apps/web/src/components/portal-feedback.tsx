import Link from "next/link";

export function PortalFeedback({
  unavailable,
  title,
  children,
}: {
  unavailable?: boolean;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`journey-message ${unavailable ? "journey-message--error" : ""}`}
      role={unavailable ? "alert" : "status"}
    >
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function LoadError({ href }: { href: string }) {
  return (
    <PortalFeedback unavailable title="We couldn't load this information">
      <p>Your items may still be available. Please try again.</p>
      <Link className="button button--secondary" href={href}>
        Try again
      </Link>
    </PortalFeedback>
  );
}
