"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  BadgeCheck,
  Bell,
  CircleUserRound,
  House,
  LifeBuoy,
  ListChecks,
  LogOut,
  Mail,
  Search,
  Settings,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Brand } from "./brand";

export function PortalHeader({
  displayName,
  email,
  role,
  unreadCount = 0,
}: {
  displayName: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "STAFF" | "ADMIN";
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const account = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (account.current) account.current.open = false;
  }, [pathname]);
  useEffect(() => {
    function closeAccountMenu(event: PointerEvent) {
      if (account.current && !account.current.contains(event.target as Node)) {
        account.current.open = false;
      }
    }
    document.addEventListener("pointerdown", closeAccountMenu);
    return () => document.removeEventListener("pointerdown", closeAccountMenu);
  }, []);
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
          <summary
            className="profile-trigger"
            aria-label={`Open profile menu for ${displayName}`}
          >
            <CircleUserRound size={24} aria-hidden="true" />
          </summary>
          <div
            className="account-menu__panel"
            onClick={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest("a") &&
                account.current
              ) {
                account.current.open = false;
              }
            }}
          >
            <div className="account-menu__heading">
              <span className="account-menu__avatar" aria-hidden="true">
                <CircleUserRound size={26} />
              </span>
              <div>
                <small>Profile details</small>
                <strong>{displayName}</strong>
              </div>
            </div>
            <dl className="account-menu__details">
              <div>
                <dt>
                  <Mail size={16} aria-hidden="true" /> Email
                </dt>
                <dd>{email}</dd>
              </div>
              <div>
                <dt>
                  <BadgeCheck size={16} aria-hidden="true" /> Account type
                </dt>
                <dd className="account-menu__role">{role.toLowerCase()}</dd>
              </div>
            </dl>
            <div className="account-menu__actions">
              <Link href="/portal/profile">
                <CircleUserRound size={18} aria-hidden="true" /> Profile
              </Link>
              <Link href="/portal/profile#account-settings">
                <Settings size={18} aria-hidden="true" /> Account settings
              </Link>
              <Link href="/portal/help">
                <LifeBuoy size={18} aria-hidden="true" /> Help &amp; FAQ
              </Link>
              <form action={logout}>
                <button type="submit">
                  <LogOut size={18} aria-hidden="true" /> Log out
                </button>
              </form>
            </div>
          </div>
        </details>
      </header>
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
    </>
  );
}
