import { jwtVerify, SignJWT } from "jose";

import { getSessionTtlSeconds, OTP_CHALLENGE_TTL_SEC } from "./constants";

export type SessionPayload = {
  sub: string;
  email: string;
  role: string;
  name?: string;
};

export type OtpChallengePayload = {
  sub: string;
  email: string;
};

const ISSUER = "console";
const AUDIENCE = "console-web";
const OTP_AUDIENCE = "console-otp";

let cachedKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or shorter than 32 characters. Set a strong value in .env."
    );
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const ttl = getSessionTtlSeconds();
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(getSecretKey());
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      role: String(payload.role ?? "admin"),
      name: payload.name ? String(payload.name) : undefined,
    };
  } catch {
    return null;
  }
}

export async function signOtpChallenge(payload: OtpChallengePayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.sub)
    .setIssuer(ISSUER)
    .setAudience(OTP_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${OTP_CHALLENGE_TTL_SEC}s`)
    .sign(getSecretKey());
}

export async function verifyOtpChallenge(
  token: string
): Promise<OtpChallengePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: ISSUER,
      audience: OTP_AUDIENCE,
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}
