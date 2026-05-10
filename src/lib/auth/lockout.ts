import { prisma } from "@/lib/prisma";

import { LOCKOUT_TIERS } from "./constants";

export type LockoutStatus =
  | { locked: false }
  | { locked: true; lockedUntil: Date; remainingSec: number };

/**
 * Returns the lockout status for the given user. Auto-clears stale
 * `lockedUntil` values that have already passed.
 */
export async function getLockoutStatus(userId: number): Promise<LockoutStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lockedUntil: true },
  });

  if (!user || !user.lockedUntil) return { locked: false };

  const now = Date.now();
  const until = user.lockedUntil.getTime();
  if (until <= now) {
    await prisma.user
      .update({
        where: { id: userId },
        data: { lockedUntil: null, failedLoginCount: 0 },
      })
      .catch(() => undefined);
    return { locked: false };
  }

  return {
    locked: true,
    lockedUntil: user.lockedUntil,
    remainingSec: Math.ceil((until - now) / 1000),
  };
}

function pickLockoutMinutes(failures: number): number | null {
  let minutes: number | null = null;
  for (const tier of LOCKOUT_TIERS) {
    if (failures >= tier.failures) minutes = tier.minutes;
  }
  return minutes;
}

/**
 * Increments the user's failed-login counter. If a lockout tier is reached,
 * sets `lockedUntil` accordingly. Returns the new state.
 */
export async function recordLoginFailure(userId: number): Promise<{
  failures: number;
  lockedUntil: Date | null;
}> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: { increment: 1 } },
    select: { failedLoginCount: true },
  });

  const minutes = pickLockoutMinutes(updated.failedLoginCount);
  if (minutes === null) {
    return { failures: updated.failedLoginCount, lockedUntil: null };
  }

  const lockedUntil = new Date(Date.now() + minutes * 60 * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: { lockedUntil },
  });
  return { failures: updated.failedLoginCount, lockedUntil };
}

/**
 * Clears the user's failed-login counter and lockout — call on successful
 * authentication (after MFA, not just after password match).
 */
export async function clearLockout(userId: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginCount: 0, lockedUntil: null },
  });
}
