import { Check, CheckCircle2, FileDown, HelpCircle, RefreshCw, X } from "lucide-react";
import { AdminPageHeader, FilterBar } from "@/components/admin-page";
import { authenticatedApi } from "@/lib/api/authenticated";
import { reviewClaim } from "@/app/actions/claim-review";

interface Claim {
  id: string;
  title: string;
  claimantName: string;
  claimantEmail: string;
  status: string;
  ownershipAnswers: Record<string, string>;
  createdAt: string;
}

async function getClaims(): Promise<Claim[]> {
  const response = await authenticatedApi("/claims");
  return response?.ok ? ((await response.json()) as Claim[]) : [];
}

export default async function ClaimsPage() {
  const claims = await getClaims();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const pendingCount = claims.filter((c) => c.status === "PENDING").length;
  const approvedCount = claims.filter((c) => c.status === "APPROVED").length;
  const releasedCount = claims.filter((c) => c.status === "RELEASED").length;

  return (
    <main className="page">
      <AdminPageHeader
        eyebrow="Ownership control"
        title="Claim verification & item release portal"
        description="Review ownership answers, approve claims for CBEA Building pickup, and mark items as released upon identity verification."
        action={
          <a className="button button--ghost" href={`${apiUrl}/api/v1/admin/export?kind=claims`} download>
            <FileDown size={17} /> Export claims
          </a>
        }
      />

      <div className="stat-grid stat-grid--compact">
        <article className="stat-card">
          <small>Pending review</small>
          <strong>{pendingCount}</strong>
          <span className="trend">Awaiting review</span>
        </article>
        <article className="stat-card">
          <small>Approved (CBEA Pickup)</small>
          <strong>{approvedCount}</strong>
          <span className="trend">Notified for pickup</span>
        </article>
        <article className="stat-card">
          <small>Released to owner</small>
          <strong>{releasedCount}</strong>
          <span className="trend">Returned & closed</span>
        </article>
        <article className="stat-card">
          <small>Total claim records</small>
          <strong>{claims.length}</strong>
          <span className="trend">Complete audit log</span>
        </article>
      </div>

      <section className="panel table-panel">
        <FilterBar>
          <span>{claims.length} claim record{claims.length === 1 ? "" : "s"}</span>
        </FilterBar>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item details</th>
                <th>Claimant</th>
                <th>Ownership proof</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                    No claims submitted yet.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => {
                  const proofText = typeof claim.ownershipAnswers === "object" && claim.ownershipAnswers !== null
                    ? Object.values(claim.ownershipAnswers).join(" · ")
                    : String(claim.ownershipAnswers || "—");

                  const statusClass =
                    claim.status === "APPROVED"
                      ? "status--matched"
                      : claim.status === "RELEASED"
                      ? "status--matched"
                      : claim.status === "REJECTED"
                      ? "status--pending"
                      : "status--pending";

                  return (
                    <tr key={claim.id}>
                      <td>
                        <b>{claim.title}</b>
                        <small>Found item</small>
                      </td>
                      <td>
                        <b>{claim.claimantName}</b>
                        <small>{claim.claimantEmail || "Verified user"}</small>
                      </td>
                      <td style={{ maxWidth: "250px", wordBreak: "break-word" }}>{proofText}</td>
                      <td>
                        <span className={`status ${statusClass}`}>
                          {claim.status === "APPROVED"
                            ? "Approved (CBEA Pickup)"
                            : claim.status === "RELEASED"
                            ? "Released to Owner"
                            : claim.status.replace("_", " ")}
                        </span>
                      </td>
                      <td>{new Date(claim.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="row-actions" style={{ gap: "6px" }}>
                          {claim.status === "PENDING" && (
                            <>
                              <form action={reviewClaim}>
                                <input name="id" type="hidden" value={claim.id} />
                                <input name="status" type="hidden" value="APPROVED" />
                                <button className="approve" title="Approve & Notify Student for Pickup at CBEA Building">
                                  <Check size={15} /> Approve
                                </button>
                              </form>
                              <form action={reviewClaim}>
                                <input name="id" type="hidden" value={claim.id} />
                                <input name="status" type="hidden" value="NEEDS_INFORMATION" />
                                <button className="button button--secondary button--sm" title="Request Information">
                                  <HelpCircle size={15} /> Info
                                </button>
                              </form>
                              <form action={reviewClaim}>
                                <input name="id" type="hidden" value={claim.id} />
                                <input name="status" type="hidden" value="REJECTED" />
                                <button className="reject" title="Reject Claim">
                                  <X size={15} /> Reject
                                </button>
                              </form>
                            </>
                          )}

                          {claim.status === "APPROVED" && (
                            <form action={reviewClaim}>
                              <input name="id" type="hidden" value={claim.id} />
                              <input name="status" type="hidden" value="RELEASED" />
                              <button className="button button--primary button--sm" title="Verify Identity & Mark Released">
                                <CheckCircle2 size={15} /> Mark Released
                              </button>
                            </form>
                          )}

                          {claim.status === "RELEASED" && (
                            <span className="status status--matched" style={{ fontSize: "0.75rem" }}>
                              <CheckCircle2 size={13} style={{ display: "inline", marginRight: "4px" }} /> Released
                            </span>
                          )}

                          {claim.status === "REJECTED" && (
                            <span className="muted" style={{ fontSize: "0.75rem" }}>Rejected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
