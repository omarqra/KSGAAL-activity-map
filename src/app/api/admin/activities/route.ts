import { NextRequest } from "next/server";

import { Prisma } from "@prisma/client";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiRole, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import {
  created,
  handleError,
  ok,
  parsePagination,
} from "../../_lib/http";
import { activityCreate } from "../../_lib/validators";

const intParam = (sp: URLSearchParams, key: string) => {
  const raw = sp.get(key);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : undefined;
};

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const typeId = intParam(sp, "typeId");
    const subtypeId = intParam(sp, "subtypeId");
    const countryId = intParam(sp, "countryId");
    const organizationId = intParam(sp, "organizationId");
    const yearFrom = intParam(sp, "yearFrom");
    const yearTo = intParam(sp, "yearTo");
    const { page, pageSize, skip, take } = parsePagination(sp);

    const where: Prisma.ActivityWhereInput = {};
    if (q) where.name = { contains: q };
    if (typeId) where.typeId = typeId;
    if (subtypeId) where.subtypeId = subtypeId;
    if (countryId) where.countryId = countryId;
    if (organizationId) where.organizationId = organizationId;
    if (yearFrom || yearTo) {
      where.dateParsed = {};
      if (yearFrom)
        (where.dateParsed as Prisma.DateTimeFilter).gte = new Date(
          Date.UTC(yearFrom, 0, 1)
        );
      if (yearTo)
        (where.dateParsed as Prisma.DateTimeFilter).lte = new Date(
          Date.UTC(yearTo, 11, 31, 23, 59, 59)
        );
    }

    const [items, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        orderBy: [{ dateParsed: "desc" }, { id: "desc" }],
        skip,
        take,
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
      prisma.activity.count({ where }),
    ]);

    return ok({ items, total, page, pageSize });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiRole(["admin", "editor"]);
    if (!auth.ok) return auth.response;
    const body = activityCreate.parse(await req.json());
    // Mirror new fields into legacy columns the public globe still reads:
    // name ← titleAr, dateParsed/dateText ← startDate (BRD #22/#23 compat).
    const startDate = body.startDate ?? null;
    const title = (body.name ?? body.titleAr) as string; // refine guarantees one
    const row = await prisma.activity.create({
      data: {
        ...body,
        name: title,
        titleAr: body.titleAr ?? title,
        dateParsed: body.dateParsed ?? startDate,
        dateText:
          body.dateText ?? (startDate ? startDate.toISOString().slice(0, 10) : null),
      },
    });
    await auditFromRequest(req, {
      action: "RESOURCE_CREATED",
      userId: auth.user.id,
      resource: "activity",
      resourceId: row.id,
      metadata: { name: row.name, typeId: row.typeId },
    });
    return created(row);
  } catch (err) {
    return handleError(err);
  }
}
