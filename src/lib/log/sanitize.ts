/**
 * PII redaction helpers for logging.
 *
 * Use {@link sanitizeForLog} to walk objects/arrays and replace values of
 * sensitive keys with `"[REDACTED]"` before passing to `console.error` /
 * structured loggers. Use {@link sanitizeError} for `Error` instances.
 */

const REDACTED = "[REDACTED]";
const MAX_DEPTH = 10;
const MAX_STRING_LEN = 2000;
const MAX_STACK_LEN = 4000;
const TRUNCATED_SUFFIX = "...[TRUNCATED]";

// Case-insensitive set of sensitive keys. Note: `email` intentionally NOT
// included — it's the primary user identifier we want visible in logs.
// Note: `passwordChangedAt` is just a timestamp so it's NOT redacted; we only
// match exact keys below, so `password` won't match `passwordChangedAt`.
const SENSITIVE_KEYS: ReadonlySet<string> = new Set(
  [
    "password",
    "passwordhash",
    "token",
    "tokenhash",
    "code",
    "codehash",
    "otp",
    "secret",
    "authorization",
    "cookie",
    "apikey",
  ].map((k) => k.toLowerCase())
);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

function truncateString(s: string, max = MAX_STRING_LEN): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + TRUNCATED_SUFFIX;
}

function sanitizeValue(
  value: unknown,
  depth: number,
  seen: WeakSet<object>
): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === "string") return truncateString(value);

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return value;
  }

  if (typeof value === "function" || typeof value === "symbol") {
    return `[${typeof value}]`;
  }

  if (depth >= MAX_DEPTH) return "[Object: max depth]";

  if (value instanceof Date) return value.toISOString();

  // Cycle protection — only objects/arrays past this point.
  if (typeof value === "object") {
    if (seen.has(value as object)) return "[Circular]";
    seen.add(value as object);

    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, depth + 1, seen));
    }

    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const v = (value as Record<string, unknown>)[key];
      if (isSensitiveKey(key)) {
        out[key] = REDACTED;
      } else {
        out[key] = sanitizeValue(v, depth + 1, seen);
      }
    }
    return out;
  }

  return value;
}

/**
 * Recursively sanitize a value for safe logging.
 *
 * - Replaces values of sensitive keys (password, token, otp, ...) with
 *   `"[REDACTED]"`.
 * - Truncates strings longer than 2000 chars.
 * - Limits recursion depth to 10.
 * - Cycle-safe via WeakSet.
 * - Does not mutate the input.
 */
export function sanitizeForLog(value: unknown): unknown {
  return sanitizeValue(value, 0, new WeakSet<object>());
}

/**
 * Sanitize an error-like value for logging.
 *
 * For `Error` instances, returns `{ name, message, stack, ...customFields }`
 * with stack truncated and any custom enumerable fields run through
 * {@link sanitizeForLog}. For non-Error values, falls back to
 * {@link sanitizeForLog}.
 */
export function sanitizeError(err: unknown): unknown {
  if (err instanceof Error) {
    const seen = new WeakSet<object>();
    const customFields: Record<string, unknown> = {};
    for (const key of Object.keys(err)) {
      if (key === "name" || key === "message" || key === "stack") continue;
      const v = (err as unknown as Record<string, unknown>)[key];
      if (isSensitiveKey(key)) {
        customFields[key] = REDACTED;
      } else {
        customFields[key] = sanitizeValue(v, 1, seen);
      }
    }
    return {
      name: err.name,
      message: truncateString(err.message ?? ""),
      stack: err.stack ? truncateString(err.stack, MAX_STACK_LEN) : undefined,
      ...customFields,
    };
  }
  return sanitizeForLog(err);
}
