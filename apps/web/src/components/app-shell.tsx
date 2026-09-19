"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Megaphone,
  PackageCheck,
  Search,
  Settings,
  UserCog,
  Users,
} from "lucide-react";
import { Brand } from "./brand";

const nav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, match: "overview" },
  { label: "Lost reports", href: "/admin/reports?type=lost", icon: Search, match: "lost" },
  { label: "Found reports", href: "/admin/reports?type=found", icon: PackageCheck, match: "found" },
  { label: "Claim verification", href: "/admin/claims", icon: CheckCircle2 },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
];

const management = [
  { label: "Master list", href: "/admin/master-list", icon: UserCog },
  { label: "Registered users", href: "/admin/users", icon: Users },
  { label: "Reports & exports", href: "/admin/analytics", icon: FileBarChart },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reportType = searchParams.get("type");

  const active = (href: string, match?: string) => {
    if (match === "overview") return pathname === "/admin";
    if (match === "lost" || match === "found") return pathname === "/admin/reports" && reportType === match;
    return pathname.startsWith(href);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand inverse />
        <nav aria-label="Administrator navigation">
          <span className="nav-label">Workspace</span>
          {nav.map(({ label, href, icon: Icon, match }) => (
            <Link className={`nav-link ${active(href, match) ? "nav-link--active" : ""}`} href={href} key={label}>
              <Icon size={17} /> {label}
            </Link>
          ))}
          <span className="nav-label">Administration</span>
          {management.map(({ label, href, icon: Icon }) => (
            <Link className={`nav-link ${active(href) ? "nav-link--active" : ""}`} href={href} key={label}>
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar__user">
          <span className="avatar">SA</span>
          <span><strong>System Admin</strong><small>Security Office</small></span>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <label className="topbar__search"><Search size={17} /><input aria-label="Search pages" placeholder="Search pages and reports…" /></label>
          <div className="topbar__actions">
            <button className="icon-button" aria-label="Tasks"><ClipboardList size={18} /></button>
            <button className="icon-button" aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button>
            <span className="avatar">SA</span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
