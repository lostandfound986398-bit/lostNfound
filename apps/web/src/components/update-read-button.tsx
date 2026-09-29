"use client";
import { useActionState } from "react";
import { markUpdateRead } from "@/app/actions/updates";
export function UpdateReadButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(markUpdateRead, {
    error: "",
  });
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="button button--secondary" disabled={pending}>
        {pending ? "Saving…" : "Mark as read"}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
