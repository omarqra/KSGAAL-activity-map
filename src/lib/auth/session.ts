import { cookies } from "next/headers";

import {
  OTP_CHALLENGE_COOKIE,
  OTP_CHALLENGE_TTL_SEC,
  SESSION_COOKIE_NAME,
  getSessionTtlSeconds,
} from "./constants";
import {
  type OtpChallengePayload,
  type SessionPayload,
  verifyOtpChallenge,
  verifySession,
} from "./jwt";

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getSessionTtlSeconds(),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setOtpChallengeCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set({
    name: OTP_CHALLENGE_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: OTP_CHALLENGE_TTL_SEC,
  });
}

export async function clearOtpChallengeCookie(): Promise<void> {
  const store = await cookies();
  store.set({
    name: OTP_CHALLENGE_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getOtpChallenge(): Promise<OtpChallengePayload | null> {
  const store = await cookies();
  const token = store.get(OTP_CHALLENGE_COOKIE)?.value;
  if (!token) return null;
  return verifyOtpChallenge(token);
}
