import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

import {
  PASSWORD_HISTORY_SIZE,
  PASSWORD_MAX_AGE_DAYS,
} from "./constants";

/**
 * Records a new password hash in the user's password history and prunes
 * older entries beyond `PASSWORD_HISTORY_SIZE`.
 */
export async function recordPasswordHistory(
  userId: number,
  passwordHash: string
): Promise<void> {
  await prisma.passwordHistory.create({
    data: { userId, passwordHash },
  });

  const all = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (all.length > PASSWORD_HISTORY_SIZE) {
    const toDelete = all.slice(PASSWORD_HISTORY_SIZE).map((row) => row.id);
    await prisma.passwordHistory.deleteMany({
      where: { id: { in: toDelete } },
    });
  }
}

/**
 * Checks whether the given plain password matches any of the user's last
 * `PASSWORD_HISTORY_SIZE` passwords (including the current one).
 */
export async function isPasswordReused(
  userId: number,
  plainPassword: string
): Promise<boolean> {
  const [current, history] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    }),
    prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: PASSWORD_HISTORY_SIZE,
      select: { passwordHash: true },
    }),
  ]);

  const candidates = [
    ...(current ? [current.passwordHash] : []),
    ...history.map((h) => h.passwordHash),
  ];

  for (const hash of candidates) {
    if (await bcrypt.compare(plainPassword, hash)) return true;
  }
  return false;
}

/**
 * Returns true if the user's password is older than `PASSWORD_MAX_AGE_DAYS`
 * and a forced rotation is required.
 */
export function isPasswordExpired(passwordChangedAt: Date | null): boolean {
  if (!passwordChangedAt) return false;
  const ageMs = Date.now() - passwordChangedAt.getTime();
  const maxMs = PASSWORD_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return ageMs > maxMs;
}
