import { prisma } from "@/lib/prisma";

import {
  RATE_LIMIT_MAX_ATTEMPTS,
  RATE_LIMIT_WINDOW_MIN,
} from "./constants";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function windowStart(): Date {
  return new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60 * 1000);
}

export async function checkLoginRateLimit(
  ip: string,
  email: string
): Promise<RateLimitResult> {
  const since = windowStart();

  const failedCount = await prisma.loginAttempt.count({
    where: {
      success: false,
      createdAt: { gte: since },
      OR: [{ ip }, { email: email.toLowerCase() }],
    },
  });

  const remaining = Math.max(0, RATE_LIMIT_MAX_ATTEMPTS - failedCount);
  const allowed = failedCount < RATE_LIMIT_MAX_ATTEMPTS;

  return {
    allowed,
    remaining,
    retryAfterSeconds: allowed ? 0 : RATE_LIMIT_WINDOW_MIN * 60,
  };
}

export async function recordLoginAttempt(input: {
  email: string;
  ip: string;
  userAgent?: string | null;
  success: boolean;
  userId?: number | null;
}): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      email: input.email.toLowerCase(),
      ip: input.ip,
      userAgent: input.userAgent ?? null,
      success: input.success,
      userId: input.userId ?? null,
    },
  });
}
