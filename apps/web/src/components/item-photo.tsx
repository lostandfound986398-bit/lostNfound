"use client";
import { useState } from "react";
import { PackageOpen } from "lucide-react";
export function ItemPhoto({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  return failed === src ? (
    <PackageOpen size={48} aria-label="Item photo unavailable" />
  ) : (
    <img src={src} alt={title} loading="lazy" onError={() => setFailed(src)} />
  );
}
