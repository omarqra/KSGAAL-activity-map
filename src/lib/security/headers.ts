/**
 * Centralized HTTP security headers applied to all routes via next.config.ts.
 *
 * Aligned with OWASP secure-headers guidance:
 *  - HSTS forces HTTPS for 2 years (with preload + subdomains)
 *  - X-Content-Type-Options blocks MIME sniffing
 *  - X-Frame-Options + CSP frame-ancestors block clickjacking
 *  - Referrer-Policy strips referrer on cross-origin downgrade
 *  - Permissions-Policy disables sensitive APIs by default
 *  - CSP locks scripts/styles to same-origin (with the inline allowances
 *    Next.js / next-intl / framer-motion currently require)
 */

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Mapbox loads its RTL text plugin from unpkg via importScripts inside a
  // Web Worker — must be in script-src for the worker to fetch it.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://unpkg.com https://api.mapbox.com",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https: blob:",
  "frame-ancestors 'none'",
].join("; ");

export const securityHeaders: ReadonlyArray<{ key: string; value: string }> = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
  },
];
