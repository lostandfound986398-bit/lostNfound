import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import Link from "next/link";
import { PortalHeader } from "@/components/portal-header";
import { portalData } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");
  if (profile.role === "ADMIN") redirect("/admin");
  const counts = await portalData<{ unread: number }>("/reports/updates/count");
  return (
    <div className="portal">
      <PortalHeader
        displayName={profile.displayName}
        unreadCount={counts?.unread ?? 0}
      />
      <div id="portal-main" tabIndex={-1}>
        {children}
      </div>
      <footer className="portal-content">
        <Link href="/portal/help">
          Need help? View the student guide and custody office details →
        </Link>
      </footer>
    </div>
  );
}
