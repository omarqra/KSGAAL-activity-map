import type { NextConfig } from "next";

import { createJiti } from "jiti";
import createNextIntlPlugin from "next-intl/plugin";
import { fileURLToPath } from "node:url";

import { securityHeaders } from "./src/lib/security/headers";

const withNextIntl = createNextIntlPlugin();
const jiti = createJiti(fileURLToPath(import.meta.url));
jiti.import("./src/env/server.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "backend-template.system2030.com",
      },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/:path*",
        headers: securityHeaders.map(({ key, value }) => ({ key, value })),
      },
    ];
  },
};

export default withNextIntl(nextConfig);
