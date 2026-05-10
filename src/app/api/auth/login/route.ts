import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

import { audit } from "@/lib/auth/audit";
import { signOtpChallenge } from "@/lib/auth/jwt";
import { getLockoutStatus, recordLoginFailure } from "@/lib/auth/lockout";
import { sendOtpToUser } from "@/lib/auth/otp";
import { verifyPassword } from "@/lib/auth/password";
import { checkLoginRateLimit, recordLoginAttempt } from "@/lib/auth/rate-limit";
import { setOtpChallengeCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
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

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_credentials_format" },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  const limit = await checkLoginRateLimit(ip, email);
  if (!limit.allowed) {
    await audit({
      action: "LOGIN_RATE_LIMITED",
      ip,
      userAgent,
      metadata: { email },
    });
    return NextResponse.json(
      { error: "too_many_attempts", retryAfter: limit.retryAfterSeconds },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const lockout = await getLockoutStatus(user.id);
    if (lockout.locked) {
      await audit({
        action: "LOGIN_RATE_LIMITED",
        userId: user.id,
        ip,
        userAgent,
        metadata: { email, reason: "account_locked", remainingSec: lockout.remainingSec },
      });
      return NextResponse.json(
        { error: "account_locked", retryAfter: lockout.remainingSec },
        {
          status: 429,
          headers: { "Retry-After": String(lockout.remainingSec) },
        }
      );
    }
  }

  // Constant-time comparison even when no user exists (anti-timing).
  const dummyHash =
    "$2a$12$CwTycUXWue0Thq9StjUM0uJ8.0QqQwQKZ5rrA9C4n4mZ6gQv6T2vC";
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, dummyHash);

  if (!user || !user.isActive || !ok) {
    await recordLoginAttempt({
      email,
      ip,
      userAgent,
      success: false,
      userId: user?.id ?? null,
    });
    if (user && !ok) {
      await recordLoginFailure(user.id);
    }
    await audit({
      action: "LOGIN_FAILED",
      userId: user?.id ?? null,
      ip,
      userAgent,
      metadata: { email, reason: !user ? "no_user" : !user.isActive ? "inactive" : "bad_password" },
    });
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  // Password verified — issue OTP challenge instead of session.
  let expiresAt: Date;
  try {
    const result = await sendOtpToUser({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    expiresAt = result.expiresAt;
  } catch (err) {
    console.error("[login] failed to send OTP", err);
    return NextResponse.json(
      { error: "otp_send_failed" },
      { status: 500 }
    );
  }

  const challenge = await signOtpChallenge({
    sub: String(user.id),
    email: user.email,
  });
  await setOtpChallengeCookie(challenge);

  // We do NOT record this as a successful login attempt yet — that happens
  // after the OTP is verified.
  return NextResponse.json({
    ok: true,
    requires2FA: true,
    email: user.email,
    expiresAt: expiresAt.getTime(),
  });
}
