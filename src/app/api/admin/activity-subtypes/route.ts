import { NextRequest } from "next/server";

import { Prisma } from "@prisma/client";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiPermission, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { created, handleError, ok } from "../../_lib/http";
import { activitySubtypeCreate } from "../../_lib/validators";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const sp = req.nextUrl.searchParams;
    const parentTypeIdRaw = sp.get("parentTypeId");
    const where: Prisma.ActivitySubtypeWhereInput = {};
    if (parentTypeIdRaw) {
      const pid = Number(parentTypeIdRaw);
      if (Number.isInteger(pid) && pid > 0) where.parentTypeId = pid;
    }

    const items = await prisma.activitySubtype.findMany({
      where,
      orderBy: [{ parentTypeId: "asc" }, { labelAr: "asc" }],
      include: {
        parentType: true,
        _count: { select: { activities: true } },
      },
    });
    return ok({ items });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiPermission("activityTypes", "create");
    if (!auth.ok) return auth.response;
    const body = activitySubtypeCreate.parse(await req.json());
    const row = await prisma.activitySubtype.create({ data: body });
    await auditFromRequest(req, {
      action: "RESOURCE_CREATED",
      userId: auth.user.id,
      resource: "activity-subtype",
      resourceId: row.id,
      metadata: { labelEn: row.labelEn, parentTypeId: row.parentTypeId },
    });
    return created(row);
  } catch (err) {
    return handleError(err);
  }
}
