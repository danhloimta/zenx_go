import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@zenx-go/api-client", "@zenx-go/web-domain"],
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  env: {
    NEXT_PUBLIC_BASE_DOMAIN: process.env.PUBLIC_BASE_DOMAIN ?? "lvh.me",
    NEXT_PUBLIC_WEB_ORIGIN: process.env.PUBLIC_WEB_ORIGIN ?? process.env.WEB_ORIGIN ?? "http://lvh.me:3000",
  },
  async rewrites() {
    const proxyOrigin = (
      process.env.API_PROXY_ORIGIN ||
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/v1\/?$/, '')
    )?.replace(/\/$/, '');
    if (!proxyOrigin) return [];
    return [
      { source: '/api/v1/:path*', destination: `${proxyOrigin}/api/v1/:path*` },
      { source: '/uploads/:path*', destination: `${proxyOrigin}/uploads/:path*` },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
};

export default nextConfig;
