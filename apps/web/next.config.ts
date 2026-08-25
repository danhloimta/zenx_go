import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zenx-go/api-client"],
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
