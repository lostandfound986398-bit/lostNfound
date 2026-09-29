import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  // Lets local device checks run alongside the usual development server.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  devIndicators: process.env.NEXT_BUILD_DIR ? false : undefined,
  transpilePackages: ["@lost-found/contracts"],
  turbopack: {
    root: resolve(process.cwd(), "../.."),
  },
};

export default nextConfig;
