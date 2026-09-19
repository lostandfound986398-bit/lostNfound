import type { NextConfig } from "next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  transpilePackages: ["@lost-found/contracts"],
  turbopack: {
    root: resolve(process.cwd(), "../.."),
  },
};

export default nextConfig;
