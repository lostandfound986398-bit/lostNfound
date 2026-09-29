"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { discardReportPhoto } from "@/app/actions/report-photos";
import { submitReport } from "@/app/actions/reports";
import { createClient } from "@/lib/supabase/client";

export function ReportFormClient({
  type,
  categories,
  locations,
}: {
  type: "lost" | "found";
  categories: string[];
  locations: string[];
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [sendingStage, setSendingStage] = useState("");
  useEffect(() => {
    if (!selectedFile) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);
  const [state, action, pending] = useActionState(
    async (previous: { error: string }, data: FormData) => {
      let uploadedKey = "";
      if (selectedFile) {
        try {
          const client = createClient();
          const { data: auth } = await client.auth.getUser();
          if (!auth.user)
            return { error: "Sign in again before uploading your photo." };
          uploadedKey = `${auth.user.id}/${crypto.randomUUID()}.${selectedFile.type.split("/")[1]}`;
          const { error } = await client.storage
            .from("report-photos")
            .upload(uploadedKey, selectedFile, { upsert: false });
          if (error)
            return {
              error:
                "The photo could not be uploaded. Try again or remove it before submitting.",
            };
          data.set("imageKey", uploadedKey);
          data.set("mimeType", selectedFile.type);
          data.set("sizeBytes", String(selectedFile.size));
        } catch {
          return {
            error:
              "The photo could not be uploaded. Try again or remove it before submitting.",
          };
        }
      }
      try {
        setSendingStage("Saving your report…");
        return await submitReport(previous, data);
      } finally {
        // The API preserves photos already attached to a committed report.
        if (uploadedKey) await discardReportPhoto(uploadedKey);
      }
    },
    { error: "" },
  );
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({
    title: "",
    category: "",
    color: "",
    location: "",
    occurredAt: "",
    publicDescription: "",
    privateVerificationDetails: "",
  });
  const [uploadError, setUploadError] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  function changeStep(next: number) {
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function next() {
    const fields = form.current?.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(
      `fieldset[data-step="${step}"] input, fieldset[data-step="${step}"] select, fieldset[data-step="${step}"] textarea`,
    );
    for (const field of fields ?? []) if (!field.reportValidity()) return;
    changeStep(step + 1);
  }
  function input(name: string) {
    return {
      name,
      value: values[name],
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
      ) => setValues((v) => ({ ...v, [name]: e.target.value })),
    };
  }
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setUploadError("Choose a JPG, PNG, or WEBP image no larger than 10 MB.");
      return;
    }
    setUploadError("");
    setSelectedFile(file);
  }
  const steps = ["Item details", "Where and when", "Review and send"];
  return (
    <form
      noValidate
      ref={form}
      action={action}
      className="stack-form report-form"
      onSubmit={(e) => {
        if (step < 2) {
          e.preventDefault();
          next();
        } else {
          setSendingStage(selectedFile ? "Uploading photo… Keep this page open." : "Saving your report…");
        }
      }}
    >
      <input type="hidden" name="type" value={type.toUpperCase()} />
      <ol className="journey-steps" aria-label="Report progress">
        {steps.map((label, i) => (
          <li key={label} aria-current={step === i ? "step" : undefined}>
            {i + 1}. {label}
          </li>
        ))}
      </ol>
      <h2 ref={heading} tabIndex={-1}>
        Step {step + 1}: {steps[step]}
      </h2>
      <fieldset hidden={step !== 0} data-step="0" className="journey-fields">
        <legend className="sr-only">Item details</legend>
        <label>
          Item name
          <input
            className="form-control"
            {...input("title")}
            placeholder="For example: brown wallet"
            maxLength={120}
            required
          />
        </label>
        <div className="two-fields">
          <label>
            Category
            <select {...input("category")} required>
              <option value="">Choose a category</option>
              {categories.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Main color
            <input
              {...input("color")}
              placeholder="For example: brown"
              required
            />
          </label>
        </div>
        <label>
          Public description (optional)
          <textarea
            {...input("publicDescription")}
            className="form-control textarea"
            maxLength={2000}
            aria-describedby="public-help"
          />
        </label>
        <small id="public-help">
          Other users can see this. Describe the appearance; leave out names,
          contact details, and identifying numbers.
        </small>
        <label>
          Private identifying details (optional)
          <textarea
            {...input("privateVerificationDetails")}
            className="form-control textarea"
            maxLength={2000}
            aria-describedby="private-help"
          />
        </label>
        <small id="private-help">
          For staff verification, not public listings. Include distinctive marks
          or contents. Never enter passwords.
        </small>
      </fieldset>
      <fieldset hidden={step !== 1} data-step="1" className="journey-fields">
        <legend className="sr-only">Location, date, and photo</legend>
        <label>
          {type === "lost"
            ? "Where did you last have it?"
            : "Where did you find it?"}
          <select {...input("location")} required>
            <option value="">Choose a location</option>
            {locations.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Date {type === "lost" ? "lost" : "found"}
          <input
            {...input("occurredAt")}
            type="date"
            max={new Date().toLocaleDateString("en-CA", {
              timeZone: "Asia/Manila",
            })}
            required
          />
        </label>
        <label>
          Item photo (optional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={pending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void upload(file);
            }}
            aria-describedby="photo-help"
          />
        </label>
        <small id="photo-help">
          JPG, PNG, or WEBP, up to 10 MB. This photo will be public; avoid
          showing personal details.
        </small>
        {uploadError && <p role="alert">{uploadError}</p>}
        {selectedFile && preview && (
          <div>
            <img
              className="journey-photo-preview"
              src={preview}
              alt="Attached item"
            />
            <button
              type="button"
              className="button button--secondary"
              disabled={pending}
              onClick={() => {
                setSelectedFile(null);
                setUploadError("");
              }}
            >
              Remove from report
            </button>
          </div>
        )}
      </fieldset>
      {step === 2 && (
        <section>
          <p>
            Check these details before publishing your{" "}
            {type === "lost" ? "missing" : "found"}-item report.
          </p>
          <dl className="journey-facts">
            {Object.entries({
              Item: values.title,
              Category: values.category,
              Color: values.color,
              Location: values.location,
              Date: values.occurredAt,
              "Public description": values.publicDescription || "None",
              "Private details (staff only)":
                values.privateVerificationDetails || "None",
              Photo: selectedFile ? "Attached" : "No photo",
            }).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>After sending, you can check progress in Items I reported.</p>
          {selectedFile && preview && (
            <figure className="review-photo">
              <img src={preview} alt="Photo to be published with your report" />
              <figcaption>
                This photo will be public. Use Back to change or remove it.
              </figcaption>
            </figure>
          )}
        </section>
      )}
      {state.error && <p role="alert">{state.error}</p>}
      {pending && (
        <div className="submission-progress" role="status">
          <progress aria-label={sendingStage || "Sending report"} />
          <span>{sendingStage || "Sending report…"}</span>
        </div>
      )}
      <div className="journey-actions report-actions">
        {step > 0 && (
          <button
            type="button"
            className="button button--secondary"
            disabled={pending}
            onClick={() => changeStep(step - 1)}
          >
            Back
          </button>
        )}
        {step < 2 ? (
          <button
            key="continue"
            type="button"
            className="button button--primary"
            disabled={pending}
            onClick={(event) => { event.preventDefault(); next(); }}
          >
            Continue
          </button>
        ) : (
          <button key="submit" type="submit" className="button button--primary" disabled={pending}>
            {pending ? "Sending report…" : "Submit item report"}
          </button>
        )}
      </div>
    </form>
  );
}
