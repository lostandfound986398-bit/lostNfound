import Link from "next/link";
import { authenticatedApi } from "@/lib/api/authenticated";
import { ReportControls } from "@/components/report-controls";
import { notFound } from "next/navigation";
import type { ItemReportSummary } from "@lost-found/contracts";
import { reportProgress } from "@/lib/portal";
import { LoadError } from "@/components/portal-feedback";
import { OwnershipForm } from "@/components/ownership-form";

type Item = ItemReportSummary & {
  publicDescription?: string;
  images?: string[];
  isOwner: boolean;
  canRequest: boolean;
  privateVerificationDetails?: string;
  matches: { id: string; title: string; status: string; reasons: string[] }[];
};
export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    notFound();
  let response: Response | null;
  try {
    response = await authenticatedApi(`/reports/${id}`);
  } catch {
    return (
      <main className="portal-content">
        <LoadError href={`/portal/items/${id}`} />
      </main>
    );
  }
  if (response?.status === 404) notFound();
  if (!response?.ok)
    return (
      <main className="portal-content">
        <LoadError href={`/portal/items/${id}`} />
      </main>
    );
  const item = (await response.json()) as Item;
  const progress = reportProgress[item.status];
  const canRequest = item.canRequest;
  return (
    <main className="portal-content portal-content--inner">
      <Link href="/portal/search">← Browse found items</Link>
      <div className="portal-title">
        <div>
          <span className="eyebrow">
            {item.type === "FOUND" ? "Found item" : "Missing item"}
          </span>
          <h1>{item.title}</h1>
          <span className="status status--open">
            {progress?.label ?? item.status}
          </span>
        </div>
      </div>
      <div className="journey-detail">
        <section className="panel">
          {!!item.images?.length && (
            <div className="journey-gallery">
              {item.images.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt={`${item.title}, photo ${i + 1}`}
                />
              ))}
            </div>
          )}
          <dl className="journey-facts">
            <div>
              <dt>Category</dt>
              <dd>{item.category}</dd>
            </div>
            <div>
              <dt>Color</dt>
              <dd>{item.color}</dd>
            </div>
            <div>
              <dt>{item.type === "FOUND" ? "Found near" : "Last seen near"}</dt>
              <dd>{item.location}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{new Date(item.occurredAt).toLocaleDateString("en-PH")}</dd>
            </div>
          </dl>
          <h2>Item description</h2>
          <p>
            {item.publicDescription ||
              "No additional public description was provided."}
          </p>
        </section>
        <aside>
          {canRequest ? (
            <OwnershipForm reportId={id} />
          ) : (
            <div className="panel">
              <h2>What happens next?</h2>
              <p>
                {item.isOwner &&
                item.type === "FOUND" &&
                ["OPEN", "MATCHED"].includes(item.status)
                  ? "You reported this item. Arrange handover with the custody office; you cannot request your own found item."
                  : progress?.next}
              </p>
              <Link href="/portal/search">Look through found items →</Link>
            </div>
          )}
          <p className="muted">
            The location describes where the item was seen, not a confirmed
            collection point. Wait for staff instructions before collecting it.
          </p>
        </aside>
      </div>
      {item.isOwner && ["OPEN", "MATCHED"].includes(item.status) && (
        <ReportControls item={item} />
      )}
      {item.isOwner && item.matches.length > 0 && (
        <section className="panel">
          <h2>Possible matches</h2>
          <p>Compare these suggestions. A match is not proof of ownership.</p>
          <div className="journey-list">
            {item.matches.map((match) => (
              <article key={match.id}>
                <Link href={`/portal/items/${match.id}`}>{match.title} →</Link>
                <p>
                  {reportProgress[match.status]?.label ?? match.status} ·{" "}
                  {match.reasons.join(", ")}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
