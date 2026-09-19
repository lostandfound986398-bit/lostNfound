import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";
import { PortalHeader } from "@/components/portal-header";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");
  if (profile.role === "ADMIN") redirect("/admin");
  return <div className="portal"><PortalHeader displayName={profile.displayName} />{children}</div>;
}
