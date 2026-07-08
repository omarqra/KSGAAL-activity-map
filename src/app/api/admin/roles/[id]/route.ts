import { NextRequest } from "next/server";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiPermission, requireApiUser } from "@/lib/auth/require-api-user";
import { normalizePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import { fail, handleError, notFound, ok, parseId } from "../../../_lib/http";
import { roleUpdate } from "../../../_lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const row = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!row) return notFound("Role");
    return ok(row);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiPermission("roles", "update");
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) return notFound("Role");

    const body = roleUpdate.parse(await req.json());
    const data: {
      nameAr?: string;
      nameEn?: string;
      permissions?: ReturnType<typeof normalizePermissions>;
    } = {};
    if (body.nameAr !== undefined) data.nameAr = body.nameAr;
    if (body.nameEn !== undefined) data.nameEn = body.nameEn;
    // The system admin role always keeps full permissions — names can change
    // but its permission map is locked so it can never be locked out.
    if (body.permissions !== undefined && !existing.isSystem) {
      data.permissions = normalizePermissions(body.permissions);
    }
    const row = await prisma.role.update({ where: { id }, data });
    await auditFromRequest(req, {
      action: "RESOURCE_UPDATED",
      userId: auth.user.id,
      resource: "role",
      resourceId: row.id,
      metadata: { fields: Object.keys(data) },
    });
    return ok(row);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiPermission("roles", "delete");
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const existing = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) return notFound("Role");
    if (existing.isSystem) return fail("ROLE_IS_SYSTEM", 409, "ROLE_IS_SYSTEM");
    if (existing._count.users > 0) {
      return fail("ROLE_HAS_USERS", 409, "ROLE_HAS_USERS", {
        userCount: existing._count.users,
      });
    }
    await prisma.role.delete({ where: { id } });
    await auditFromRequest(req, {
      action: "RESOURCE_DELETED",
      userId: auth.user.id,
      resource: "role",
      resourceId: id,
      metadata: { key: existing.key },
    });
    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
