import Link from "next/link";
import { StaffContact } from "@/components/staff-contact";
export default function HelpPage() {
  return (
    <main className="portal-content portal-content--inner">
      <div className="portal-title">
        <div>
          <span className="eyebrow">Student guide</span>
          <h1>How to use lost and found</h1>
        </div>
      </div>
      <div className="journey-list">
        <section className="panel">
          <h2>I lost something</h2>
          <ol>
            <li>
              <Link href="/portal/search">Search found items</Link>. Try the
              item name, category, location, and date.
            </li>
            <li>
              Open an item and compare its details. If it looks like yours,
              choose “This might be mine” and describe a detail only you would
              know.
            </li>
            <li>
              If nothing matches,{" "}
              <Link href="/portal/report/lost">report your missing item</Link>.
              Add its appearance, last known location, and date.
            </li>
            <li>
              Check <Link href="/portal/reports">Items I reported</Link> for
              progress and open your report to see possible matches.
            </li>
          </ol>
        </section>
        <section className="panel">
          <h2>I found something</h2>
          <ol>
            <li>
              <Link href="/portal/report/found">Report the found item</Link>.
            </li>
            <li>
              Keep names, ID numbers, and other identifying clues out of public
              descriptions and photos. Use the private details field for staff
              verification.
            </li>
            <li>
              Review and submit, then arrange physical handover with the custody
              office.
            </li>
          </ol>
        </section>
        <section className="panel">
          <h2>Track an ownership request</h2>
          <ol>
            <li>
              Open <Link href="/portal/claims">My ownership requests</Link>.
            </li>
            <li>“Under review” means staff are checking your details.</li>
            <li>
              For “More details needed,” read the staff note and use the reply
              form.
            </li>
            <li>
              “Approved for collection” means you can arrange collection. Bring
              your school ID.
            </li>
            <li>
              “Collected” means staff recorded the handover. “Not approved”
              includes an explanation.
            </li>
          </ol>
          <p>
            Check <Link href="/portal/updates">Updates</Link> for new matches,
            decisions, and announcements. A suggested match is not proof of
            ownership.
          </p>
        </section>
        <section className="panel">
          <h2>Correct or close a report</h2>
          <p>
            Open your report from Items I reported. Use Edit report to correct
            its details, or Close report if it is no longer needed. These
            actions are available before an ownership review starts. Contact
            staff for changes during a review.
          </p>
        </section>
        <StaffContact />
      </div>
    </main>
  );
}
