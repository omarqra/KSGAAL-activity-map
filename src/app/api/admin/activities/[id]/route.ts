import { NextRequest } from "next/server";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiRole, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { fail, handleError, notFound, ok, parseId } from "../../../_lib/http";
import { activityUpdate } from "../../../_lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const row = await prisma.activity.findUnique({
      where: { id },
      include: {
        type: true,
        subtype: true,
        country: true,
        organization: true,
      },
    });
    if (!row) return notFound("Activity");
    return ok(row);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiRole(["admin", "editor"]);
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const body = activityUpdate.parse(await req.json());
    const row = await prisma.activity.update({ where: { id }, data: body });
    await auditFromRequest(req, {
      action: "RESOURCE_UPDATED",
      userId: auth.user.id,
      resource: "activity",
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
    const auth = await requireApiRole(["admin", "editor"]);
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const target = await prisma.activity.findUnique({
      where: { id },
      select: { name: true, typeId: true },
    });
    await prisma.activity.delete({ where: { id } });
    await auditFromRequest(req, {
      action: "RESOURCE_DELETED",
      userId: auth.user.id,
      resource: "activity",
      resourceId: id,
      metadata: target ? { name: target.name, typeId: target.typeId } : undefined,
    });
    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
