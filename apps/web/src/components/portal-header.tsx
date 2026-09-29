"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Bell,
  CircleUserRound,
  House,
  ListChecks,
  LogOut,
  Search,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Brand } from "./brand";

export function PortalHeader({
  displayName,
  unreadCount = 0,
}: {
  displayName: string;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const account = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (account.current) account.current.open = false;
  }, [pathname]);
  const links = [
    {
      label: "Home",
      href: "/portal",
      icon: House,
      active: pathname === "/portal",
    },
    {
      label: "Search",
      href: "/portal/search",
      icon: Search,
      active:
        pathname.startsWith("/portal/search") ||
        pathname.startsWith("/portal/items"),
    },
    {
      label: "My Activity",
      href: "/portal/activity",
      icon: ListChecks,
      active: [
        "/portal/activity",
        "/portal/reports",
        "/portal/claims",
        "/portal/report/",
      ].some((path) => pathname.startsWith(path)),
    },
    {
      label: "Updates",
      href: "/portal/updates",
      icon: Bell,
      active: pathname === "/portal/updates",
    },
  ];
  return (
    <>
      <a className="skip-link" href="#portal-main">
        Skip to content
      </a>
      <header className="portal-header">
        <Brand href="/portal" />
        <nav className="portal-nav device-nav" aria-label="Student navigation">
          {links.map(({ label, href, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
            >
              <span className="nav-icon">
                <Icon size={22} aria-hidden="true" />
                {label === "Updates" && unreadCount > 0 && (
                  <span
                    className="unread-badge"
                    aria-label={`${unreadCount} unread updates`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <details
          className="account-menu"
          ref={account}
          onKeyDown={(e) => {
            if (e.key === "Escape" && account.current) {
              account.current.open = false;
              account.current.querySelector("summary")?.focus();
            }
          }}
        >
          <summary aria-label="Account and help">
            <CircleUserRound size={24} aria-hidden="true" />
            <span>Account</span>
          </summary>
          <div className="account-menu__panel">
            <strong>{displayName}</strong>
            <Link href="/portal/help">Help &amp; custody office</Link>
            <form action={logout}>
              <button type="submit">
                <LogOut size={18} aria-hidden="true" /> Log out
              </button>
            </form>
          </div>
        </details>
      </header>
    </>
  );
}
