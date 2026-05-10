import { NextRequest } from "next/server";

import type { Prisma } from "@prisma/client";

import { requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { handleError, ok } from "../../_lib/http";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(n, MAX_LIMIT);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const limit = parseLimit(req.nextUrl.searchParams.get("limit"));

    const where: Prisma.ActivityWhereInput = { countryId: { not: null } };

    const grouped = await prisma.activity.groupBy({
      by: ["countryId"],
      _count: { _all: true },
      where,
      orderBy: { _count: { countryId: "desc" } },
    });

    const total = grouped.reduce((s, g) => s + g._count._all, 0);
    const distinctCount = grouped.length;
    const topGroups = grouped.slice(0, limit);
    const ids = topGroups
      .map((g) => g.countryId)
      .filter((v): v is number => v !== null);

    const countries = await prisma.country.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true, nameAr: true, nameEn: true },
    });
    const countryById = new Map(countries.map((c) => [c.id, c]));

    const items = topGroups
      .map((g) => {
        if (g.countryId == null) return null;
        const country = countryById.get(g.countryId);
        if (!country) return null;
        return {
          country,
          count: g._count._all,
          share: total > 0 ? (g._count._all / total) * 100 : 0,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    const topCountry = items[0]
      ? { ...items[0].country, count: items[0].count }
      : null;

    return ok({
      limit,
      total,
      distinctCount,
      topCountry,
      items,
    });
  } catch (err) {
    return handleError(err);
  }
}
