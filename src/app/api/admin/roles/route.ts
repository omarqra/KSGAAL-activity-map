import { NextRequest } from "next/server";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiPermission, requireApiUser } from "@/lib/auth/require-api-user";
import { normalizePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import { created, handleError, ok } from "../../_lib/http";
import { roleCreate } from "../../_lib/validators";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const roles = await prisma.role.findMany({
      orderBy: [{ isSystem: "desc" }, { id: "asc" }],
      include: { _count: { select: { users: true } } },
    });
    const items = roles.map((r) => ({
      id: r.id,
      key: r.key,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      isSystem: r.isSystem,
      permissions: r.permissions,
      userCount: r._count.users,
      updatedAt: r.updatedAt,
    }));
    return ok({ items, total: items.length });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiPermission("roles", "create");
    if (!auth.ok) return auth.response;
    const body = roleCreate.parse(await req.json());
    const row = await prisma.role.create({
      data: {
        key: body.key,
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        isSystem: false,
        permissions: normalizePermissions(body.permissions),
      },
    });
    await auditFromRequest(req, {
      action: "RESOURCE_CREATED",
      userId: auth.user.id,
      resource: "role",
      resourceId: row.id,
      metadata: { key: row.key },
    });
    return created(row);
  } catch (err) {
    return handleError(err);
  }
}
