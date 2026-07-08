import { NextRequest } from "next/server";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiPermission, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { fail, handleError, notFound, ok, parseId } from "../../../_lib/http";
import { activityTypeUpdate } from "../../../_lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const row = await prisma.activityType.findUnique({
      where: { id },
      include: {
        subtypes: { orderBy: { labelAr: "asc" } },
        _count: { select: { activities: true } },
      },
    });
    if (!row) return notFound("ActivityType");
    return ok(row);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiPermission("activityTypes", "update");
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const body = activityTypeUpdate.parse(await req.json());
    const row = await prisma.activityType.update({ where: { id }, data: body });
    await auditFromRequest(req, {
      action: "RESOURCE_UPDATED",
      userId: auth.user.id,
      resource: "activity-type",
      resourceId: row.id,
      metadata: { fields: Object.keys(body) },
    });
    return ok(row);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiPermission("activityTypes", "delete");
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const target = await prisma.activityType.findUnique({
      where: { id },
      select: { labelEn: true },
    });
    await prisma.activityType.delete({ where: { id } });
    await auditFromRequest(req, {
      action: "RESOURCE_DELETED",
      userId: auth.user.id,
      resource: "activity-type",
      resourceId: id,
      metadata: target ? { labelEn: target.labelEn } : undefined,
    });
    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
