import crypto from "crypto";

import bcrypt from "bcryptjs";

import { sendEmail } from "@/lib/email/send";
import { otpEmail } from "@/lib/email/templates/otp";
import { prisma } from "@/lib/prisma";

import {
  OTP_EXPIRY_MIN,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SEC,
} from "./constants";

const BCRYPT_COST = 10;

function generateNumericCode(length: number): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}

export type CreateOtpResult = {
  code: string;
  expiresAt: Date;
};

export async function createOtpForUser(userId: number): Promise<CreateOtpResult> {
  const code = generateNumericCode(OTP_LENGTH);
  const codeHash = await bcrypt.hash(code, BCRYPT_COST);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MIN * 60 * 1000);

  await prisma.otpCode.updateMany({
    where: { userId, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await prisma.otpCode.create({
    data: { userId, codeHash, expiresAt },
  });

  return { code, expiresAt };
}

export async function sendOtpToUser(input: {
  userId: number;
  email: string;
  name: string | null;
}): Promise<{ expiresAt: Date }> {
  const { code, expiresAt } = await createOtpForUser(input.userId);
  const { subject, html } = otpEmail({
    name: input.name,
    code,
    expiresInMinutes: OTP_EXPIRY_MIN,
  });
  await sendEmail({ to: input.email, subject, html });
  return { expiresAt };
}

export type VerifyOtpResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "invalid" | "too_many_attempts" | "not_found"; remainingAttempts?: number };

export async function verifyOtpForUser(
  userId: number,
  code: string
): Promise<VerifyOtpResult> {
  const otp = await prisma.otpCode.findFirst({
    where: { userId, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { ok: false, reason: "not_found" };

  if (otp.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts", remainingAttempts: 0 };
  }

  const matches = await bcrypt.compare(code, otp.codeHash);
  if (!matches) {
    const updated = await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return {
      ok: false,
      reason: "invalid",
      remainingAttempts: Math.max(0, OTP_MAX_ATTEMPTS - updated.attempts),
    };
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true };
}

export async function canResendOtp(userId: number): Promise<{ allowed: boolean; retryAfterSec: number }> {
  const last = await prisma.otpCode.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!last) return { allowed: true, retryAfterSec: 0 };
  const elapsed = Math.floor((Date.now() - last.createdAt.getTime()) / 1000);
  if (elapsed >= OTP_RESEND_COOLDOWN_SEC) return { allowed: true, retryAfterSec: 0 };
  return { allowed: false, retryAfterSec: OTP_RESEND_COOLDOWN_SEC - elapsed };
}
