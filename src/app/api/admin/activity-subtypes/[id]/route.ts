import { NextRequest } from "next/server";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiPermission, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { fail, handleError, notFound, ok, parseId } from "../../../_lib/http";
import { activitySubtypeUpdate } from "../../../_lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const row = await prisma.activitySubtype.findUnique({
      where: { id },
      include: { parentType: true },
    });
    if (!row) return notFound("ActivitySubtype");
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
    const body = activitySubtypeUpdate.parse(await req.json());
    const row = await prisma.activitySubtype.update({
      where: { id },
      data: body,
    });
    await auditFromRequest(req, {
      action: "RESOURCE_UPDATED",
      userId: auth.user.id,
      resource: "activity-subtype",
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
    const target = await prisma.activitySubtype.findUnique({
      where: { id },
      select: { labelEn: true, parentTypeId: true },
    });
    await prisma.activitySubtype.delete({ where: { id } });
    await auditFromRequest(req, {
      action: "RESOURCE_DELETED",
      userId: auth.user.id,
      resource: "activity-subtype",
      resourceId: id,
      metadata: target
        ? { labelEn: target.labelEn, parentTypeId: target.parentTypeId }
        : undefined,
    });
    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
