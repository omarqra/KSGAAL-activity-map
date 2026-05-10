import { NextRequest, NextResponse } from "next/server";

const buckets = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_MAX = 60;
const DEFAULT_WINDOW_MS = 60 * 1000;

function getIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export type RateLimitOptions = {
  bucket: string;
  max?: number;
  windowMs?: number;
};

export function checkApiRateLimit(
  req: NextRequest,
  opts: RateLimitOptions
): { allowed: boolean; retryAfterSec: number } {
  const max = opts.max ?? DEFAULT_MAX;
  const windowMs = opts.windowMs ?? DEFAULT_WINDOW_MS;
  const ip = getIp(req);
  const key = `${opts.bucket}:${ip}`;
  const now = Date.now();

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function rateLimitResponse(retryAfterSec: number): NextResponse {
  return NextResponse.json(
    { error: "too_many_requests", retryAfter: retryAfterSec },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec) },
    }
  );
}

// Periodic cleanup so the in-memory map doesn't grow unbounded.
if (typeof globalThis !== "undefined") {
  const g = globalThis as unknown as { __apiRateLimitCleanup?: NodeJS.Timeout };
  if (!g.__apiRateLimitCleanup) {
    g.__apiRateLimitCleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
      }
    }, 60_000);
    g.__apiRateLimitCleanup.unref?.();
  }
}
