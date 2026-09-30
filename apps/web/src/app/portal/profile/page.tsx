import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleUserRound, KeyRound, ArrowRight } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/profile";

export default async function ProfilePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");

  return (
    <main className="portal-content portal-content--inner student-profile">
      <div className="portal-title">
        <div>
          <span className="eyebrow">Your account</span>
          <h1>Profile</h1>
        </div>
      </div>
      <section
        className="panel student-profile__details"
        aria-labelledby="profile-name"
      >
        <span className="account-menu__avatar">
          <CircleUserRound size={28} aria-hidden="true" />
        </span>
        <h2 id="profile-name">{profile.displayName}</h2>
        <dl>
          <div>
            <dt>Email address</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>Account type</dt>
            <dd className="account-menu__role">{profile.role.toLowerCase()}</dd>
          </div>
        </dl>
        <p>
          Need to correct your name or email?{" "}
          <Link href="/portal/help">Contact the Faculty Office.</Link>
        </p>
      </section>
      <section
        id="account-settings"
        className="panel student-profile__settings"
        aria-labelledby="settings-heading"
      >
        <h2 id="settings-heading">Account settings</h2>
        <p>Keep your account secure with a password only you know.</p>
        <Link
          className="button button--primary"
          href="/account/update-password"
        >
          <KeyRound size={18} aria-hidden="true" /> Change password{" "}
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
