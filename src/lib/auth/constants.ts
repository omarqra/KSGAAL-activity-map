export const SESSION_COOKIE_NAME = "session";

export const DEFAULT_SESSION_TTL_DAYS = 7;

export function getSessionTtlSeconds(): number {
  // eslint-disable-next-line n/no-process-env
  const days = Number(process.env.SESSION_TTL_DAYS ?? DEFAULT_SESSION_TTL_DAYS);
  return Math.max(1, Math.floor(days)) * 24 * 60 * 60;
}

export const RATE_LIMIT_WINDOW_MIN = 15;
export const RATE_LIMIT_MAX_ATTEMPTS = 5;

export const PASSWORD_HISTORY_SIZE = 5;
export const PASSWORD_MAX_AGE_DAYS = 90;

export const LOCKOUT_TIERS: ReadonlyArray<{ failures: number; minutes: number }> = [
  { failures: 5, minutes: 15 },
  { failures: 10, minutes: 60 },
  { failures: 15, minutes: 24 * 60 },
];

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MIN = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_SEC = 60;

export const RESET_TOKEN_EXPIRY_MIN = 30;
export const RESET_TOKEN_BYTES = 32;

export const OTP_CHALLENGE_COOKIE = "otp_challenge";
export const OTP_CHALLENGE_TTL_SEC = OTP_EXPIRY_MIN * 60;
