import { requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { handleError, ok } from "../../../_lib/http";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const recentCutoff = new Date(Date.now() - SEVEN_DAYS);

    const [total, active, byRole, recentLogins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { _all: true },
      }),
      prisma.user.count({ where: { lastLoginAt: { gte: recentCutoff } } }),
    ]);

    return ok({
      total,
      active,
      disabled: total - active,
      recentLogins,
      byRole: byRole.map((g) => ({ role: g.role, count: g._count._all })),
    });
  } catch (err) {
    return handleError(err);
  }
}
