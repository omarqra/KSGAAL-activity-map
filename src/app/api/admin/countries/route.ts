import { NextRequest } from "next/server";

import { Prisma } from "@prisma/client";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiPermission, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import {
  created,
  handleError,
  ok,
  parsePagination,
} from "../../_lib/http";
import {
  COUNTRY_REGIONS,
  ENTITY_STATUSES,
  countryCreate,
} from "../../_lib/validators";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const region = sp.get("region") ?? undefined;
    const status = sp.get("status") ?? undefined;
    const hasDetailedMapRaw = sp.get("hasDetailedMap");
    const { page, pageSize, skip, take } = parsePagination(sp);

    const where: Prisma.CountryWhereInput = {};
    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { nameAr: { contains: q } },
        { nameEn: { contains: q, mode: "insensitive" } },
        { short: { contains: q } },
      ];
    }
    if (region && (COUNTRY_REGIONS as readonly string[]).includes(region)) {
      where.region = region;
    }
    if (status && (ENTITY_STATUSES as readonly string[]).includes(status)) {
      where.status = status;
    }
    if (hasDetailedMapRaw === "true" || hasDetailedMapRaw === "false") {
      where.hasDetailedMap = hasDetailedMapRaw === "true";
    }

    const [items, total] = await Promise.all([
      prisma.country.findMany({
        where,
        orderBy: { nameAr: "asc" },
        skip,
        take,
        include: {
          _count: { select: { activities: true, organizations: true } },
        },
      }),
      prisma.country.count({ where }),
    ]);

    return ok({ items, total, page, pageSize });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiPermission("countries", "create");
    if (!auth.ok) return auth.response;
    const body = countryCreate.parse(await req.json());
    const row = await prisma.country.create({ data: body });
    await auditFromRequest(req, {
      action: "RESOURCE_CREATED",
      userId: auth.user.id,
      resource: "country",
      resourceId: row.id,
      metadata: { code: row.code, nameEn: row.nameEn },
    });
    return created(row);
  } catch (err) {
    return handleError(err);
  }
}
