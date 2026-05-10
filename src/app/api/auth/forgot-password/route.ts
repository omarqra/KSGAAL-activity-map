import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { env } from "@/env/server";
import { audit, getAuditClientIp, getAuditUserAgent } from "@/lib/auth/audit";
import {
  RESET_TOKEN_BYTES,
  RESET_TOKEN_EXPIRY_MIN,
} from "@/lib/auth/constants";
import { sendEmail } from "@/lib/email/send";
import { resetPasswordEmail } from "@/lib/email/templates/reset-password";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ForgotSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  locale: z.enum(["ar", "en"]).optional().default("ar"),
});

const GENERIC_RESPONSE = {
  ok: true,
  message: "if-account-exists-email-sent",
};

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ForgotSchema.safeParse(body);
  if (!parsed.success) {
    // Even on bad input we return generic to avoid enumeration of valid forms.
    return NextResponse.json(GENERIC_RESPONSE);
  }
  const { email, locale } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString("base64url");
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MIN * 60 * 1000);

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  await audit({
    action: "PASSWORD_RESET_REQUESTED",
    userId: user.id,
    ip: getAuditClientIp(req),
    userAgent: getAuditUserAgent(req),
    metadata: { email: user.email },
  });

  const resetUrl = `${env.APP_URL}/${locale}/auth/reset-password?token=${encodeURIComponent(
    rawToken
  )}`;

  try {
    const { subject, html } = resetPasswordEmail({
      name: user.name,
      resetUrl,
      expiresInMinutes: RESET_TOKEN_EXPIRY_MIN,
    });
    await sendEmail({ to: user.email, subject, html });
  } catch (err) {
    console.error("[forgot-password] email failed", err);
    // Do NOT reveal email-send failure — keep response generic.
  }

  return NextResponse.json(GENERIC_RESPONSE);
}
