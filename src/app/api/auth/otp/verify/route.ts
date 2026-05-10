import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { audit } from "@/lib/auth/audit";
import { signSession } from "@/lib/auth/jwt";
import { clearLockout } from "@/lib/auth/lockout";
import { verifyOtpForUser } from "@/lib/auth/otp";
import { isPasswordExpired } from "@/lib/auth/password-policy";
import { recordLoginAttempt } from "@/lib/auth/rate-limit";
import {
  clearOtpChallengeCookie,
  getOtpChallenge,
  setSessionCookie,
} from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const VerifySchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = VerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_code_format" }, { status: 400 });
  }

  const challenge = await getOtpChallenge();
  if (!challenge) {
    return NextResponse.json(
      { error: "challenge_expired_or_missing" },
      { status: 401 }
    );
  }

  const userId = Number(challenge.sub);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: "invalid_challenge" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    await clearOtpChallengeCookie();
    return NextResponse.json({ error: "user_unavailable" }, { status: 401 });
  }

  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  const result = await verifyOtpForUser(user.id, parsed.data.code);

  if (!result.ok) {
    await audit({
      action: "OTP_FAILED",
      userId: user.id,
      ip,
      userAgent,
      metadata: { reason: result.reason },
    });
    if (result.reason === "expired" || result.reason === "not_found") {
      await clearOtpChallengeCookie();
      return NextResponse.json(
        { error: "otp_expired", remainingAttempts: 0 },
        { status: 401 }
      );
    }
    if (result.reason === "too_many_attempts") {
      await clearOtpChallengeCookie();
      return NextResponse.json(
        { error: "too_many_attempts", remainingAttempts: 0 },
        { status: 429 }
      );
    }
    return NextResponse.json(
      {
        error: "invalid_code",
        remainingAttempts: result.remainingAttempts ?? 0,
      },
      { status: 401 }
    );
  }

  // OTP verified — issue real session.
  const token = await signSession({
    sub: String(user.id),
    email: user.email,
    role: user.role,
    name: user.name ?? undefined,
  });
  await setSessionCookie(token);
  await clearOtpChallengeCookie();

  await Promise.all([
    recordLoginAttempt({
      email: user.email,
      ip,
      userAgent,
      success: true,
      userId: user.id,
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }),
    clearLockout(user.id),
    audit({
      action: "OTP_VERIFIED",
      userId: user.id,
      ip,
      userAgent,
    }),
    audit({
      action: "LOGIN_SUCCESS",
      userId: user.id,
      ip,
      userAgent,
    }),
  ]);

  const passwordExpired = isPasswordExpired(user.passwordChangedAt);

  return NextResponse.json({
    ok: true,
    passwordExpired,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
