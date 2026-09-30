export function StaffContact() {
  const office = process.env.LOST_FOUND_OFFICE || "CBEA Faculty Office";
  const email = process.env.LOST_FOUND_EMAIL;
  const phone = process.env.LOST_FOUND_PHONE;
  const hours = process.env.LOST_FOUND_HOURS;
  return (
    <section className="panel staff-contact">
      <h2>Lost-and-found help</h2>
      <p>{office}</p>
      {email && (
        <p>
          Email: <a href={`mailto:${email}`}>{email}</a>
        </p>
      )}
      {phone && (
        <p>
          Phone: <a href={`tel:${phone}`}>{phone}</a>
        </p>
      )}
      <p>
        {hours
          ? `Office hours: ${hours}`
          : "Ask the CBEA office to confirm staff availability before visiting."}
      </p>
      <p>
        Bring your school ID for collection. Submitting a found-item report does
        not record a physical handover.
      </p>
    </section>
  );
}
