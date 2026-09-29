export function ProgressSteps({ status, kind }: { status: string; kind: "report" | "claim" }) {
  const labels = kind === "claim" ? ["Submitted", "Staff review", "Ready to collect", "Collected"] : ["Reported", "Looking for owner or item", "Ownership review", "Returned"];
  const current = kind === "claim" ? ({ PENDING: 1, NEEDS_INFORMATION: 1, APPROVED: 2, RELEASED: 3, REJECTED: 1 } as Record<string, number>)[status]
    : ({ OPEN: 1, MATCHED: 1, CLAIM_PENDING: 2, CLAIMED: 3 } as Record<string, number>)[status];
  if (current === undefined || status === "REJECTED") return <p className="muted">{status === "REJECTED" ? "Review finished — request not approved." : "This report is closed or not yet published."}</p>;
  return <ol className="progress-track" aria-label={kind === "claim" ? "Ownership request progress" : "Report progress"}>
    {labels.map((label, index) => <li key={label} className={index < current ? "is-complete" : ""} aria-current={index === current ? "step" : undefined}>
      <span aria-hidden="true">{index < current ? "✓" : index + 1}</span><strong>{label}</strong><small>{index < current ? "Completed" : index === current ? (index === 3 ? "Completed" : "Current step") : "Upcoming"}</small>
    </li>)}
  </ol>;
}
