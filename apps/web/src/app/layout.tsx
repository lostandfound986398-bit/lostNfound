import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CBEA Lost & Found",
  description: "Report, search, match, and safely claim lost items on campus.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
