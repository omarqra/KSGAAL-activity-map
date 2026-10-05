import { cookies, headers } from "next/headers";

import { env } from "@/env/server";

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

/**
 * Whether to mark the auth cookies `Secure`.
 *
 * This used to be `NODE_ENV === "production"`, which broke sign-in outright on
 * the academy's development cluster: the image sets NODE_ENV=production, the
 * app is reached over plain http on a node port, and every browser silently
 * discards a Secure cookie on an insecure origin. The password step appeared
 * to work, the one-time code was accepted, and the next request arrived with
 * no cookie at all — reported back as "the session expired".
 *
 * So the question is not "is this a production build" but "did this request
 * arrive over https", which is a different question with a different answer.
 *
 * Order: an explicit COOKIE_SECURE wins; otherwise the proxy's
 * x-forwarded-proto, which is what an ingress sets and is correct per request;
 * otherwise the scheme of APP_URL, for a direct hit with no proxy in front.
 * The result is that https deployments get Secure cookies automatically, with
 * nothing to remember to switch on.
 */
async function shouldMarkCookiesSecure(): Promise<boolean> {
  if (env.COOKIE_SECURE) return env.COOKIE_SECURE === "true";

  const forwardedProto = (await headers()).get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]!.trim().toLowerCase() === "https";
  }

  return env.APP_URL.startsWith("https://");
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: await shouldMarkCookiesSecure(),
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
    secure: await shouldMarkCookiesSecure(),
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
    secure: await shouldMarkCookiesSecure(),
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
    secure: await shouldMarkCookiesSecure(),
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
