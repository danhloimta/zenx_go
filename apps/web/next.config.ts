import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zenx-go/api-client"],
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  env: {
    NEXT_PUBLIC_BASE_DOMAIN: process.env.PUBLIC_BASE_DOMAIN ?? "localhost",
    NEXT_PUBLIC_WEB_ORIGIN: process.env.PUBLIC_WEB_ORIGIN ?? process.env.WEB_ORIGIN ?? "http://localhost:3000",
  },
};

export default nextConfig;
