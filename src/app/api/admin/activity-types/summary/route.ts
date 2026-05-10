import { requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { handleError, ok } from "../../../_lib/http";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const [mainTypes, subtypes, totalClassified, lastType, lastSubtype] =
      await Promise.all([
        prisma.activityType.count(),
        prisma.activitySubtype.count(),
        prisma.activity.count(),
        prisma.activityType.findFirst({
          orderBy: { updatedAt: "desc" },
          select: { updatedAt: true },
        }),
        prisma.activitySubtype.findFirst({
          orderBy: { updatedAt: "desc" },
          select: { updatedAt: true },
        }),
      ]);

    const lastUpdate = [lastType?.updatedAt, lastSubtype?.updatedAt]
      .filter((d): d is Date => d instanceof Date)
      .sort((a, b) => b.getTime() - a.getTime())[0]
      ?.toISOString() ?? null;

    return ok({
      mainTypes,
      subtypes,
      totalClassified,
      avgSubtypesPerType: mainTypes > 0 ? subtypes / mainTypes : 0,
      lastUpdate,
    });
  } catch (err) {
    return handleError(err);
  }
}
