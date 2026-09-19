"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Brand } from "./brand";

export function PortalHeader({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const initials = displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const links = [
    { label: "Find an item", href: "/portal" },
    { label: "My reports", href: "/portal/reports" },
    { label: "My claims", href: "/portal/claims" },
  ];

  return <header className="portal-header">
    <Brand />
    <nav className="portal-nav" aria-label="User navigation">
      {links.map(({ label, href }) => <Link className={pathname === href ? "portal-nav--active" : ""} href={href} key={href}>{label}</Link>)}
      <button className="icon-button" aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button>
      <span className="avatar avatar--red" title={displayName}>{initials}</span>
      <form action={logout}><button className="icon-button" aria-label="Log out" title="Log out"><LogOut size={17} /></button></form>
    </nav>
  </header>;
}
