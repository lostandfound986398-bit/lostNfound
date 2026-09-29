"use client";
import { useEffect, useRef } from "react";
export function SearchFilters({
  children,
  count,
}: {
  children: React.ReactNode;
  count: number;
}) {
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 761px)");
    const adapt = () => {
      if (details.current) details.current.open = media.matches;
    };
    adapt();
    media.addEventListener("change", adapt);
    return () => media.removeEventListener("change", adapt);
  }, []);
  return (
    <details className="search-filters" ref={details} open>
      <summary>Filters{count ? ` (${count} applied)` : ""}</summary>
      {children}
    </details>
  );
}
