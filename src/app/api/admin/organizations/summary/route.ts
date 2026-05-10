import { requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { handleError, ok } from "../../../_lib/http";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const [total, active, byKind, distinctCountries] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: "active" } }),
      prisma.organization.groupBy({
        by: ["kind"],
        _count: { _all: true },
      }),
      prisma.organization.findMany({
        where: { countryId: { not: null } },
        distinct: ["countryId"],
        select: { countryId: true },
      }),
    ]);

    return ok({
      total,
      active,
      pending: total - active,
      coverageCountries: distinctCountries.length,
      byKind: byKind.map((g) => ({
        kind: g.kind,
        count: g._count._all,
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}
