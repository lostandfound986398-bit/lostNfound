import { AppShell } from "@/components/app-shell";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/profile";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/");
  if (profile.role !== "ADMIN") redirect("/portal");
  return <AppShell>{children}</AppShell>;
}
