"use client";
import { useActionState } from "react";
import { messageReporter } from "@/app/actions/case-message";
export function CaseMessageForm({
  id,
  matchId,
  sent = false,
}: {
  id: string;
  matchId?: string;
  sent?: boolean;
}) {
  const [state, action, pending] = useActionState(messageReporter, {
    error: "",
    success: "",
  });
  if (sent || state.success)
    return (
      <p role="status" className="case-delivery">
        {state.success ||
          "Student notified in Updates. Waiting for their response."}
      </p>
    );
  return (
    <form action={action} className="stack-form case-message-form">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={matchId ? "MATCH" : "DETAILS"} />
      {matchId && (
        <>
          <input type="hidden" name="matchId" value={matchId} />
          <label>
            <input type="checkbox" name="reviewed" required /> I compared these
            items and reviewed this possible match.
          </label>
        </>
      )}
      <p className="muted">
        {matchId
          ? "Invites the student to inspect this item and submit proof. This does not approve ownership."
          : "Asks the student to edit their report and add private identifying details."}
      </p>
      {state.error && <p role="alert">{state.error}</p>}
      <button disabled={pending} className="button button--primary">
        {pending
          ? "Sending…"
          : matchId
            ? "Notify student of possible match"
            : "Request identifying details"}
      </button>
    </form>
  );
}
