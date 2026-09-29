import Link from "next/link";
import { PackageOpen } from "lucide-react";
import type { ItemReportSummary } from "@lost-found/contracts";
import { reportProgress } from "@/lib/portal";

export function ItemCard({ report }: { report: ItemReportSummary }) {
  return (
    <article className="item-card">
      <Link className="item-card__link" href={`/portal/items/${report.id}`}>
        <div className="item-card__visual">
          {report.imageUrl ? (
            <img src={report.imageUrl} alt="" />
          ) : (
            <PackageOpen size={48} aria-hidden="true" />
          )}
        </div>
        <div className="item-card__body">
          <span className="status status--open">
            {reportProgress[report.status]?.label ?? report.status}
          </span>
          <h3>{report.title}</h3>
          <p>
            {report.category} · {report.color}
          </p>
          <p>
            {report.location} ·{" "}
            {new Date(report.occurredAt).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <span className="item-card__cta">View item details →</span>
        </div>
      </Link>
    </article>
  );
}
