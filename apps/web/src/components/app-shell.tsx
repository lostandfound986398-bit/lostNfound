"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PackageCheck,
  Search,
  Settings,
  UserCog,
  Users,
  Menu,
  X,
} from "lucide-react";
import { Brand } from "./brand";
import { logout } from "@/app/actions/auth";

const nav = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    match: "overview",
  },
  {
    label: "Lost reports",
    href: "/admin/reports?type=lost",
    icon: Search,
    match: "lost",
  },
  {
    label: "Found reports",
    href: "/admin/reports?type=found",
    icon: PackageCheck,
    match: "found",
  },
  { label: "Ownership requests", href: "/admin/claims", icon: CheckCircle2 },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
];

const management = [
  { label: "Master list", href: "/admin/master-list", icon: UserCog },
  { label: "Registered users", href: "/admin/users", icon: Users },
  { label: "Reports & exports", href: "/admin/analytics", icon: FileBarChart },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const drawer = useRef<HTMLDialogElement>(null);
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reportType = searchParams.get("type");
  useEffect(() => {
    drawer.current?.close();
  }, [pathname, reportType]);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 761px)");
    const close = () => {
      if (media.matches) drawer.current?.close();
    };
    media.addEventListener("change", close);
    return () => media.removeEventListener("change", close);
  }, []);

  const active = (href: string, match?: string) => {
    if (match === "overview") return pathname === "/admin";
    if (match === "lost" || match === "found")
      return pathname === "/admin/reports" && reportType === match;
    return pathname.startsWith(href);
  };

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#admin-main">
        Skip to content
      </a>
      <dialog
        className="admin-drawer"
        ref={drawer}
        aria-label="Administrator menu"
        onClick={(e) => {
          if (e.target === e.currentTarget) drawer.current?.close();
        }}
      >
        <div className="admin-drawer__content">
          <div className="drawer-heading">
            <strong>Staff workspace</strong>
            <button
              className="icon-button"
              onClick={() => drawer.current?.close()}
              aria-label="Close menu"
            >
              <X />
            </button>
          </div>
          <nav aria-label="Mobile administrator navigation">
            {[...nav, ...management].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => drawer.current?.close()}
                aria-current={
                  pathname === href.split("?")[0] &&
                  (!href.includes("?") ||
                    href.endsWith(`=${reportType ?? "lost"}`))
                    ? "page"
                    : undefined
                }
              >
                <Icon size={22} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </dialog>
      <aside className="sidebar">
        <Brand inverse href="/admin" />
        <nav aria-label="Administrator navigation">
          <span className="nav-label">Workspace</span>
          {nav.map(({ label, href, icon: Icon, match }) => (
            <Link
              className={`nav-link ${active(href, match) ? "nav-link--active" : ""}`}
              href={href}
              key={label}
              title={label}
              aria-label={label}
              aria-current={active(href, match) ? "page" : undefined}
            >
              <Icon size={22} aria-hidden="true" />{" "}
              <span className="sidebar-link-label">{label}</span>
            </Link>
          ))}
          <span className="nav-label">Administration</span>
          {management.map(({ label, href, icon: Icon }) => (
            <Link
              className={`nav-link ${active(href) ? "nav-link--active" : ""}`}
              href={href}
              key={label}
              title={label}
              aria-label={label}
              aria-current={active(href) ? "page" : undefined}
            >
              <Icon size={22} aria-hidden="true" />{" "}
              <span className="sidebar-link-label">{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar__user">
          <span className="avatar">SA</span>
          <span>
            <strong>System Admin</strong>
            <small>Security Office</small>
          </span>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button admin-menu-toggle"
            aria-label="Open administrator menu"
            aria-haspopup="dialog"
            onClick={() => drawer.current?.showModal()}
          >
            <Menu aria-hidden="true" />
          </button>
          <button
            className="icon-button sidebar-toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu aria-hidden="true" />
          </button>
          <span>Lost-and-found staff workspace</span>
          <form action={logout}>
            <button className="button button--secondary" type="submit">
              <LogOut size={17} aria-hidden="true" /> Log out
            </button>
          </form>
        </header>
        <div id="admin-main" tabIndex={-1}>
          {children}
        </div>
      </div>
    </div>
  );
}
