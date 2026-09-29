"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { submitClaim } from "@/app/actions/claims";

export function OwnershipForm({ reportId }: { reportId: string }) {
  const [state, action, pending] = useActionState(submitClaim, { error: "" });
  const [answer, setAnswer] = useState("");
  return (
    <details className="panel ownership-form">
      <summary>This might be mine</summary>
      <h2>Help staff confirm it belongs to you</h2>
      <p>
        This is an ownership request. Staff will review your details before
        approving collection.
      </p>
      <form action={action} className="stack-form">
        <input type="hidden" name="reportId" value={reportId} />
        <label htmlFor="ownership-answer">Private ownership details</label>
        <p id="ownership-help">
          Describe a distinctive mark, the contents, or another detail only the
          owner would know. Do not include passwords. These answers are sent to
          staff.
        </p>
        <textarea
          id="ownership-answer"
          name="ownershipAnswer"
          className="form-control textarea"
          required
          maxLength={2000}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          aria-describedby={`ownership-help${state.error ? " ownership-error" : ""}`}
        />
        {state.error && (
          <p id="ownership-error" role="alert">
            {state.error}{" "}
            <Link href="/portal/claims">My ownership requests</Link> ·{" "}
            <Link href="/">Sign in</Link>
          </p>
        )}
        <button className="button button--primary" disabled={pending}>
          {pending ? "Sending request…" : "Send ownership request"}
        </button>
      </form>
    </details>
  );
}
