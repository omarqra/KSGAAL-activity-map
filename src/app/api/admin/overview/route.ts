import { requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { handleError, ok } from "../../_lib/http";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const [
      countriesCount,
      organizationsCount,
      activitiesCount,
      typesCount,
      subtypesCount,
      activitiesByType,
      activitiesByCountry,
      recentActivities,
    ] = await Promise.all([
      prisma.country.count(),
      prisma.organization.count(),
      prisma.activity.count(),
      prisma.activityType.count(),
      prisma.activitySubtype.count(),
      prisma.activity.groupBy({
        by: ["typeId"],
        _count: { _all: true },
      }),
      prisma.activity.groupBy({
        by: ["countryId"],
        _count: { _all: true },
        where: { countryId: { not: null } },
        orderBy: { _count: { countryId: "desc" } },
        take: 10,
      }),
      prisma.activity.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 15,
        include: {
          type: true,
          subtype: true,
          country: {
            select: {
              id: true,
              code: true,
              nameAr: true,
              nameEn: true,
              short: true,
              capital: true,
              lat: true,
              lng: true,
            },
          },
          organization: {
            select: {
              id: true,
              code: true,
              nameAr: true,
              nameEn: true,
              short: true,
              city: true,
              lat: true,
              lng: true,
              country: {
                select: { id: true, code: true, nameAr: true, nameEn: true },
              },
            },
          },
        },
      }),
    ]);

    const types = await prisma.activityType.findMany({
      where: { id: { in: activitiesByType.map((g) => g.typeId) } },
      select: { id: true, key: true, labelAr: true, labelEn: true, color: true },
    });
    const typeById = new Map(types.map((t) => [t.id, t]));

    const countries = await prisma.country.findMany({
      where: {
        id: {
          in: activitiesByCountry
            .map((g) => g.countryId)
            .filter((v): v is number => v !== null),
        },
      },
      select: { id: true, code: true, nameAr: true, nameEn: true },
    });
    const countryById = new Map(countries.map((c) => [c.id, c]));

    return ok({
      counts: {
        countries: countriesCount,
        organizations: organizationsCount,
        activities: activitiesCount,
        activityTypes: typesCount,
        activitySubtypes: subtypesCount,
      },
      activitiesByType: activitiesByType.map((g) => ({
        type: typeById.get(g.typeId),
        count: g._count._all,
      })),
      topCountries: activitiesByCountry.map((g) => ({
        country: g.countryId ? countryById.get(g.countryId) : null,
        count: g._count._all,
      })),
      recentActivities,
    });
  } catch (err) {
    return handleError(err);
  }
}
