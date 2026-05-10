import { requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { handleError, ok } from "../../../_lib/http";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const [total, active, withDetailedMap, byRegion] = await Promise.all([
      prisma.country.count(),
      prisma.country.count({ where: { status: "active" } }),
      prisma.country.count({ where: { hasDetailedMap: true } }),
      prisma.country.groupBy({
        by: ["region"],
        _count: { _all: true },
      }),
    ]);

    return ok({
      total,
      active,
      pending: total - active,
      withDetailedMap,
      regionsCount: byRegion.length,
      byRegion: byRegion.map((g) => ({
        region: g.region,
        count: g._count._all,
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
