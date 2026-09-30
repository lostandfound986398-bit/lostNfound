import Link from "next/link";
import { CalendarDays, MapPin, PackageOpen } from "lucide-react";
import type { ItemReportSummary } from "@lost-found/contracts";
import { claimProgress, reportProgress } from "@/lib/portal";
import { ItemPhoto } from "./item-photo";

export function ItemCard({
  report,
  ownershipStatus,
}: {
  report: ItemReportSummary;
  ownershipStatus?: string;
}) {
  return (
    <article className="item-card">
      <Link className="item-card__link" href={`/portal/items/${report.id}`}>
        <div className="item-card__visual">
          {report.imageUrl ? (
            <ItemPhoto src={report.imageUrl} title={report.title} />
          ) : (
            <PackageOpen size={48} aria-hidden="true" />
          )}
        </div>
        <div className="item-card__body">
          <div className="item-card__topline">
            {!ownershipStatus && (
              <span className="status status--open">
                {reportProgress[report.status]?.label ?? report.status}
              </span>
            )}
            <span className="item-card__category">{report.category}</span>
          </div>
          <h3>{report.title}</h3>
          {ownershipStatus && (
            <span className="item-card__ownership">
              Your request:{" "}
              {claimProgress[ownershipStatus]?.label ?? ownershipStatus}
            </span>
          )}
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
          <span className="item-card__cta">
            {ownershipStatus
              ? "View item & request status"
              : "View item details"}{" "}
            →
          </span>
        </div>
      </Link>
    </article>
  );
}
