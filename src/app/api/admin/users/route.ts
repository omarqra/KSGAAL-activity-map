import { NextRequest } from "next/server";

import {
  checkApiRateLimit,
  rateLimitResponse,
} from "@/lib/auth/api-rate-limit";
import { auditFromRequest } from "@/lib/auth/audit";
import { hashPassword } from "@/lib/auth/password";
import { recordPasswordHistory } from "@/lib/auth/password-policy";
import {
  requireApiPermission,
  requireApiUser,
} from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { created, handleError, ok } from "../../_lib/http";
import { userCreate } from "../../_lib/validators";

/** Resolve a (role key, roleId) pair from whatever the client sent, keeping the
    legacy `role` string and the new `roleId` foreign key in sync. */
export async function resolveRole(
  roleKey: string | undefined,
  roleId: number | null | undefined
): Promise<{ role: string; roleId: number | null }> {
  if (roleId) {
    const r = await prisma.role.findUnique({
      where: { id: roleId },
      select: { key: true },
    });
    if (r) return { role: r.key, roleId };
  }
  const key = roleKey ?? "admin";
  const r = await prisma.role.findUnique({
    where: { key },
    select: { id: true },
  });
  return { role: key, roleId: r?.id ?? null };
}

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const items = await prisma.user.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleId: true,
        isActive: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return ok({
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rate = checkApiRateLimit(req, { bucket: "admin:users:write", max: 30 });
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    const auth = await requireApiPermission("users", "create");
    if (!auth.ok) return auth.response;
    const body = userCreate.parse(await req.json());
    const resolved = await resolveRole(body.role, body.roleId);
    const passwordHash = await hashPassword(body.password);
    const row = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name ?? null,
        role: resolved.role,
        roleId: resolved.roleId,
        isActive: body.isActive ?? true,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleId: true,
        isActive: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    await recordPasswordHistory(row.id, passwordHash);
    await auditFromRequest(req, {
      action: "USER_CREATED",
      userId: auth.user.id,
      resource: "user",
      resourceId: row.id,
      metadata: { email: row.email, role: row.role },
    });
    return created(row);
  } catch (err) {
    return handleError(err);
  }
}
