import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { passwordSchema } from "@/app/api/_lib/validators";
import { audit, getAuditClientIp, getAuditUserAgent } from "@/lib/auth/audit";
import { clearLockout } from "@/lib/auth/lockout";
import { hashPassword } from "@/lib/auth/password";
import {
  isPasswordReused,
  recordPasswordHistory,
} from "@/lib/auth/password-policy";
import { sendEmail } from "@/lib/email/send";
import { passwordChangedEmail } from "@/lib/email/templates/password-changed";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ResetSchema = z.object({
  token: z.string().min(8).max(512),
  password: passwordSchema,
});

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 422 }
    );
  }
  const { token, password } = parsed.data;

  // Look up unconsumed, unexpired tokens. We have to compare bcrypt hashes,
  // so we fetch a small candidate set then bcrypt.compare each.
  const candidates = await prisma.passwordResetToken.findMany({
    where: {
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { id: true, email: true, name: true, isActive: true },
      },
    },
  });

  let matched: (typeof candidates)[number] | null = null;
  for (const c of candidates) {
    if (await bcrypt.compare(token, c.tokenHash)) {
      matched = c;
      break;
    }
  }

  if (!matched || !matched.user.isActive) {
    return NextResponse.json(
      { error: "invalid_or_expired_token" },
      { status: 400 }
    );
  }

  if (await isPasswordReused(matched.user.id, password)) {
    return NextResponse.json(
      { error: "password_reused" },
      { status: 400 }
    );
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: matched.user.id },
      data: { passwordHash, passwordChangedAt: new Date() },
    }),
    prisma.passwordResetToken.update({
      where: { id: matched.id },
      data: { consumedAt: new Date() },
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: matched.user.id,
        consumedAt: null,
        id: { not: matched.id },
      },
      data: { consumedAt: new Date() },
    }),
  ]);

  await recordPasswordHistory(matched.user.id, passwordHash);
  await clearLockout(matched.user.id);

  await audit({
    action: "PASSWORD_RESET_COMPLETED",
    userId: matched.user.id,
    ip: getAuditClientIp(req),
    userAgent: getAuditUserAgent(req),
    metadata: { email: matched.user.email },
  });

  // Send notification (fire-and-forget — does not block response).
  const { subject, html } = passwordChangedEmail({
    name: matched.user.name,
    email: matched.user.email,
  });
  sendEmail({ to: matched.user.email, subject, html }).catch((err) => {
    console.error("[reset-password] notification email failed", err);
  });

  return NextResponse.json({ ok: true });
}
