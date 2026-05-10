import { requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { handleError, ok } from "../../../_lib/http";

const REFERENCE_YEAR = 2026;

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const startOfYear = new Date(Date.UTC(REFERENCE_YEAR, 0, 1));
    const endOfYear = new Date(
      Date.UTC(REFERENCE_YEAR, 11, 31, 23, 59, 59)
    );
    const startOfNextYear = new Date(Date.UTC(REFERENCE_YEAR + 1, 0, 1));

    const [
      total,
      thisYear,
      upcoming,
      countriesReached,
      organizationsReached,
      byType,
      topCountryGroup,
    ] = await Promise.all([
      prisma.activity.count(),
      prisma.activity.count({
        where: { dateParsed: { gte: startOfYear, lte: endOfYear } },
      }),
      prisma.activity.count({
        where: { dateParsed: { gte: startOfNextYear } },
      }),
      prisma.activity
        .findMany({
          where: { countryId: { not: null } },
          distinct: ["countryId"],
          select: { countryId: true },
        })
        .then((rows) => rows.length),
      prisma.activity
        .findMany({
          where: { organizationId: { not: null } },
          distinct: ["organizationId"],
          select: { organizationId: true },
        })
        .then((rows) => rows.length),
      prisma.activity.groupBy({
        by: ["typeId"],
        _count: { _all: true },
      }),
      prisma.activity.groupBy({
        by: ["countryId"],
        where: { countryId: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      }),
    ]);

    const types = await prisma.activityType.findMany({
      select: { id: true, key: true, labelAr: true, labelEn: true, color: true },
    });
    const typeById = new Map(types.map((t) => [t.id, t]));

    const topCountry = topCountryGroup[0]
      ? await prisma.country.findUnique({
          where: { id: topCountryGroup[0].countryId! },
          select: { code: true, nameAr: true, nameEn: true, short: true },
        })
      : null;

    return ok({
      total,
      thisYear,
      upcoming,
      countriesReached,
      organizationsReached,
      byType: byType
        .map((g) => {
          const meta = typeById.get(g.typeId);
          return meta
            ? {
                typeId: meta.id,
                key: meta.key,
                labelAr: meta.labelAr,
                labelEn: meta.labelEn,
                color: meta.color,
                count: g._count._all,
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => b.count - a.count),
      topCountry: topCountry
        ? {
            code: topCountry.code,
            nameAr: topCountry.nameAr,
            nameEn: topCountry.nameEn,
            short: topCountry.short,
            count: topCountryGroup[0]._count._all,
          }
        : null,
    });
  } catch (err) {
    return handleError(err);
  }
}
