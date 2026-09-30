import {
  Check,
  CheckCircle2,
  FileDown,
  HelpCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { AdminPageHeader, FilterBar } from "@/components/admin-page";
import { authenticatedApi } from "@/lib/api/authenticated";
import { ClaimReviewForm } from "@/components/claim-review-form";

interface Claim {
  id: string;
  title: string;
  claimantName: string;
  claimantEmail: string;
  status: string;
  ownershipAnswers: Record<string, string | string[]>;
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
        description="Review ownership answers, notify students to claim approved items at the CBEA Faculty Office, and record release after identity verification."
        action={
          <a
            className="button button--ghost"
            href={`${apiUrl}/api/v1/admin/export?kind=claims`}
            download
          >
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
          <small>Approved (Faculty Office)</small>
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
          <span>
            {claims.length} claim record{claims.length === 1 ? "" : "s"}
          </span>
        </FilterBar>

        <div className="table-scroll">
          <table
            className="data-table responsive-claims"
            role="table"
            aria-label="Ownership requests to review"
          >
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader">
                  Item details
                </th>
                <th scope="col" role="columnheader">
                  Claimant
                </th>
                <th scope="col" role="columnheader">
                  Ownership proof
                </th>
                <th scope="col" role="columnheader">
                  Status
                </th>
                <th scope="col" role="columnheader">
                  Submitted
                </th>
                <th scope="col" role="columnheader">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {claims.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    No claims submitted yet.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => {
                  const proofText =
                    typeof claim.ownershipAnswers === "object" &&
                    claim.ownershipAnswers !== null
                      ? Object.values(claim.ownershipAnswers).flat().join(" · ")
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
                    <tr key={claim.id} role="row">
                      <td data-label="Item" role="cell">
                        <b>{claim.title}</b>
                        <small>Found item</small>
                      </td>
                      <td data-label="Claimant" role="cell">
                        <b>{claim.claimantName}</b>
                        <small>{claim.claimantEmail || "Verified user"}</small>
                      </td>
                      <td
                        data-label="Ownership details"
                        role="cell"
                        style={{ maxWidth: "250px", wordBreak: "break-word" }}
                      >
                        {proofText}
                      </td>
                      <td data-label="Status" role="cell">
                        <span className={`status ${statusClass}`}>
                          {claim.status === "APPROVED"
                            ? "Approved (Faculty Office)"
                            : claim.status === "RELEASED"
                              ? "Released to Owner"
                              : claim.status.replace("_", " ")}
                        </span>
                      </td>
                      <td data-label="Submitted" role="cell">
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </td>
                      <td data-label="Review decision" role="cell">
                        <ClaimReviewForm
                          key={`${claim.id}-${claim.status}`}
                          id={claim.id}
                          status={claim.status}
                        />
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
