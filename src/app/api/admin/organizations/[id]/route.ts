import { NextRequest } from "next/server";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiRole, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { fail, handleError, notFound, ok, parseId } from "../../../_lib/http";
import { organizationUpdate } from "../../../_lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const row = await prisma.organization.findUnique({
      where: { id },
      include: {
        country: true,
        activities: {
          include: { type: true, subtype: true },
          orderBy: { dateParsed: "desc" },
        },
      },
    });
    if (!row) return notFound("Organization");
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
    const body = organizationUpdate.parse(await req.json());
    const row = await prisma.organization.update({ where: { id }, data: body });
    await auditFromRequest(req, {
      action: "RESOURCE_UPDATED",
      userId: auth.user.id,
      resource: "organization",
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
    const target = await prisma.organization.findUnique({
      where: { id },
      select: { nameEn: true, kind: true },
    });
    await prisma.organization.delete({ where: { id } });
    await auditFromRequest(req, {
      action: "RESOURCE_DELETED",
      userId: auth.user.id,
      resource: "organization",
      resourceId: id,
      metadata: target ? { nameEn: target.nameEn, kind: target.kind } : undefined,
    });
    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
