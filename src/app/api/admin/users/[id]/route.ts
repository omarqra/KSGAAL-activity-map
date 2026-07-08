import { NextRequest } from "next/server";

import {
  checkApiRateLimit,
  rateLimitResponse,
} from "@/lib/auth/api-rate-limit";
import { auditFromRequest } from "@/lib/auth/audit";
import { hashPassword } from "@/lib/auth/password";
import {
  isPasswordReused,
  recordPasswordHistory,
} from "@/lib/auth/password-policy";
import {
  requireApiPermission,
  requireApiUser,
} from "@/lib/auth/require-api-user";
import { sendEmail } from "@/lib/email/send";
import { passwordChangedEmail } from "@/lib/email/templates/password-changed";
import { prisma } from "@/lib/prisma";

import { fail, handleError, notFound, ok, parseId } from "../../../_lib/http";
import { userUpdate } from "../../../_lib/validators";
import { resolveRole } from "../route";

type Ctx = { params: Promise<{ id: string }> };

const USER_SELECT = {
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
} as const;

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const row = await prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!row) return notFound("User");
    return ok(row);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const rate = checkApiRateLimit(req, { bucket: "admin:users:write", max: 30 });
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    const auth = await requireApiPermission("users", "update");
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const body = userUpdate.parse(await req.json());

    if (body.password !== undefined) {
      if (await isPasswordReused(id, body.password)) {
        return fail("Password recently used. Choose a different one.", 400, "PASSWORD_REUSED");
      }
    }

    const data: Record<string, unknown> = {};
    if (body.email !== undefined) data.email = body.email;
    if (body.name !== undefined) data.name = body.name ?? null;
    if (body.role !== undefined || body.roleId !== undefined) {
      const resolved = await resolveRole(body.role, body.roleId);
      data.role = resolved.role;
      data.roleId = resolved.roleId;
    }
    if (body.isActive !== undefined) data.isActive = body.isActive;
    let newPasswordHash: string | undefined;
    if (body.password !== undefined) {
      newPasswordHash = await hashPassword(body.password);
      data.passwordHash = newPasswordHash;
      data.passwordChangedAt = new Date();
    }

    const row = await prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });

    if (newPasswordHash) {
      await recordPasswordHistory(row.id, newPasswordHash);
    }

    const fields = Object.keys(body);
    await auditFromRequest(req, {
      action: body.password !== undefined ? "USER_PASSWORD_CHANGED" : "USER_UPDATED",
      userId: auth.user.id,
      resource: "user",
      resourceId: row.id,
      metadata: { targetEmail: row.email, fields },
    });

    if (body.password !== undefined) {
      const { subject, html } = passwordChangedEmail({ name: row.name, email: row.email });
      sendEmail({ to: row.email, subject, html }).catch((err) => {
        console.error("[email] password-changed failed", err);
      });
    }

    return ok(row);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const rate = checkApiRateLimit(req, { bucket: "admin:users:write", max: 30 });
    if (!rate.allowed) return rateLimitResponse(rate.retryAfterSec);

    const auth = await requireApiPermission("users", "delete");
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const target = await prisma.user.findUnique({
      where: { id },
      select: { email: true },
    });
    await prisma.user.delete({ where: { id } });
    await auditFromRequest(req, {
      action: "USER_DELETED",
      userId: auth.user.id,
      resource: "user",
      resourceId: id,
      metadata: target ? { targetEmail: target.email } : undefined,
    });
    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
