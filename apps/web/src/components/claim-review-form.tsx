"use client";
import { useActionState, useState } from "react";
import { reviewClaim } from "@/app/actions/claim-review";
export function ClaimReviewForm({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [notes, setNotes] = useState("");
  const [state, action, pending] = useActionState(reviewClaim, { error: "" });
  const [decision, setDecision] = useState(
    status === "APPROVED" ? "RELEASED" : "NEEDS_INFORMATION",
  );
  if (["RELEASED", "REJECTED"].includes(status))
    return <span>Review completed</span>;
  return (
    <form key={status} action={action} className="stack-form">
      <input type="hidden" name="id" value={id} />
      <label>
        Decision
        <select
          name="status"
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
        >
          {status === "APPROVED" ? (
            <option value="RELEASED">Record collection</option>
          ) : (
            <>
              <option value="NEEDS_INFORMATION">
                Ask for more information
              </option>
              <option value="APPROVED">Approve collection</option>
            </>
          )}
          <option value="REJECTED">Do not approve</option>
        </select>
      </label>
      <label>
        Message to student
        <textarea
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={2000}
          required={["NEEDS_INFORMATION", "REJECTED"].includes(decision)}
          placeholder="Explain the next step or the reason for your decision."
        />
      </label>
      {decision === "RELEASED" && (
        <label>
          <input type="checkbox" required /> I verified the school ID and handed
          over the item.
        </label>
      )}
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">{state.success}</p>}
      <button disabled={pending} className="button button--primary">
        {pending ? "Saving…" : "Save decision"}
      </button>
    </form>
  );
}
