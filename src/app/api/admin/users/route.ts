import { NextRequest } from "next/server";

import {
  checkApiRateLimit,
  rateLimitResponse,
} from "@/lib/auth/api-rate-limit";
import { auditFromRequest } from "@/lib/auth/audit";
import { hashPassword } from "@/lib/auth/password";
import { recordPasswordHistory } from "@/lib/auth/password-policy";
import { requireApiRole, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { created, handleError, ok } from "../../_lib/http";
import { userCreate } from "../../_lib/validators";

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

    const auth = await requireApiRole(["admin"]);
    if (!auth.ok) return auth.response;
    const body = userCreate.parse(await req.json());
    const passwordHash = await hashPassword(body.password);
    const row = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name ?? null,
        role: body.role,
        isActive: body.isActive ?? true,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
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
