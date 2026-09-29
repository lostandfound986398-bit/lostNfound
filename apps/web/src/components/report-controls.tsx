"use client";
import { useActionState, useEffect, useState } from "react";
import { closeReport, editReport } from "@/app/actions/student-progress";
import type { ItemReportSummary } from "@lost-found/contracts";
export function ReportControls({
  item,
}: {
  item: ItemReportSummary & {
    publicDescription?: string;
    privateVerificationDetails?: string;
  };
}) {
  const [values, setValues] = useState({
    title: item.title,
    color: item.color,
    occurredAt: item.occurredAt.slice(0, 10),
    publicDescription: item.publicDescription || "",
    privateVerificationDetails: item.privateVerificationDetails || "",
  });
  function field(name: keyof typeof values) {
    return {
      name,
      value: values[name],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => setValues((v) => ({ ...v, [name]: e.target.value })),
    };
  }
  const [closeState, closeAction, closing] = useActionState(closeReport, {
    error: "",
  });
  const [editState, editAction, saving] = useActionState(editReport, {
    error: "",
  });
  return (
    <section className="panel">
      <h2>Manage my report</h2>
      <details>
        <summary>Edit report</summary>
        <form action={editAction} className="stack-form">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="type" value={item.type} />
          <label>
            Item name
            <input {...field("title")} required maxLength={120} />
          </label>
          <label>
            Main color
            <input {...field("color")} required />
          </label>
          <ReportOptions category={item.category} location={item.location} />
          <label>
            Date lost or found
            <input
              {...field("occurredAt")}
              type="date"
              required
              max={new Date().toLocaleDateString("en-CA", {
                timeZone: "Asia/Manila",
              })}
            />
          </label>
          <label>
            Public description
            <textarea {...field("publicDescription")} maxLength={2000} />
          </label>
          <label>
            Private identifying details (staff only)
            <textarea
              {...field("privateVerificationDetails")}
              maxLength={2000}
            />
          </label>
          <p>
            Existing photos are kept. Matching suggestions are recalculated
            after saving.
          </p>
          {editState.error && <p role="alert">{editState.error}</p>}
          {editState.success && <p role="status">{editState.success}</p>}
          <button
            disabled={saving || closing}
            className="button button--primary"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </details>
      <details>
        <summary>Close report</summary>
        <form action={closeAction} className="stack-form">
          <input type="hidden" name="id" value={item.id} />
          <p>
            Close this report if you recovered the item yourself or the report
            is no longer needed. It will leave active search results and remain
            in your history. This does not record a staff handover.
          </p>
          <label>
            <input type="checkbox" required /> I no longer need this report to
            be active.
          </label>
          {closeState.error && <p role="alert">{closeState.error}</p>}
          <button
            disabled={closing || saving}
            className="button button--secondary"
          >
            {closing ? "Closing…" : "Close my report"}
          </button>
        </form>
      </details>
    </section>
  );
}
function ReportOptions({
  category,
  location,
}: {
  category: string;
  location: string;
}) {
  const [selectedCategory, setCategory] = useState(category);
  const [selectedLocation, setLocation] = useState(location);
  const [options, setOptions] = useState<{
    categories: string[];
    locations: string[];
  } | null>(null);
  useEffect(() => {
    import("@/app/actions/report-options")
      .then(({ reportOptions }) => reportOptions())
      .then(setOptions)
      .catch(() => setOptions(null));
  }, []);
  return (
    <>
      <label>
        Category
        <select
          name="category"
          value={selectedCategory}
          onChange={(e) => setCategory(e.target.value)}
        >
          {Array.from(new Set([category, ...(options?.categories ?? [])])).map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </label>
      <label>
        Location
        <select
          name="location"
          value={selectedLocation}
          onChange={(e) => setLocation(e.target.value)}
        >
          {Array.from(new Set([location, ...(options?.locations ?? [])])).map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </label>
      {!options && (
        <p role="status">
          Category and location choices are loading or unavailable. Your current
          choices are retained.
        </p>
      )}
    </>
  );
}
