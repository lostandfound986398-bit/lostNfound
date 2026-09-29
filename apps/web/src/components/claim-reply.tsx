"use client";
import { useActionState, useState } from "react";
import { replyToClaim } from "@/app/actions/student-progress";
export function ClaimReply({ id }: { id: string }) {
  const [message, setMessage] = useState("");
  const [state, action, pending] = useActionState(replyToClaim, { error: "" });
  return (
    <form action={action} className="stack-form">
      <input type="hidden" name="id" value={id} />
      <label>
        Additional private ownership details
        <textarea
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={2000}
          className="form-control textarea"
        />
      </label>
      <small>
        Only staff can review these details. Never include passwords.
      </small>
      {state.error && <p role="alert">{state.error}</p>}
      {state.success && <p role="status">Your reply was sent for review.</p>}
      <button className="button button--primary" disabled={pending}>
        {pending ? "Sending…" : "Send additional details"}
      </button>
    </form>
  );
}
