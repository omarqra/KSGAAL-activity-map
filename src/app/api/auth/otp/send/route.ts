import { NextResponse } from "next/server";

import { canResendOtp, sendOtpToUser } from "@/lib/auth/otp";
import { getOtpChallenge } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
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
    return NextResponse.json({ error: "user_unavailable" }, { status: 401 });
  }

  const cooldown = await canResendOtp(user.id);
  if (!cooldown.allowed) {
    return NextResponse.json(
      { error: "resend_cooldown", retryAfter: cooldown.retryAfterSec },
      {
        status: 429,
        headers: { "Retry-After": String(cooldown.retryAfterSec) },
      }
    );
  }

  let expiresAt: Date;
  try {
    const result = await sendOtpToUser({
      userId: user.id,
      email: user.email,
      name: user.name,
    });
    expiresAt = result.expiresAt;
  } catch (err) {
    console.error("[otp] failed to resend", err);
    return NextResponse.json({ error: "otp_send_failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email: user.email,
    expiresAt: expiresAt.getTime(),
  });
}
