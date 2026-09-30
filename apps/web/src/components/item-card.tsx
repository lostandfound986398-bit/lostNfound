import Link from "next/link";
import { CalendarDays, MapPin, PackageOpen } from "lucide-react";
import type { ItemReportSummary } from "@lost-found/contracts";
import { reportProgress } from "@/lib/portal";

export function ItemCard({ report }: { report: ItemReportSummary }) {
  return (
    <article className="item-card">
      <Link className="item-card__link" href={`/portal/items/${report.id}`}>
        <div className="item-card__visual">
          {report.imageUrl ? (
            <img src={report.imageUrl} alt={report.title} />
          ) : (
            <PackageOpen size={48} aria-hidden="true" />
          )}
        </div>
        <div className="item-card__body">
          <div className="item-card__topline">
            <span className="status status--open">
              {reportProgress[report.status]?.label ?? report.status}
            </span>
            <span className="item-card__category">{report.category}</span>
          </div>
          <h3>{report.title}</h3>
          <p className="item-card__description">{report.color}</p>
          <div className="item-card__details">
            <span>
              <MapPin size={15} aria-hidden="true" /> {report.location}
            </span>
            <span>
              <CalendarDays size={15} aria-hidden="true" />{" "}
              {new Date(report.occurredAt).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <span className="item-card__cta">View item details →</span>
        </div>
      </Link>
    </article>
  );
}
