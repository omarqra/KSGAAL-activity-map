/**
 * Shared client helper to turn an API error envelope's `code`/`message` into a
 * localized string using the `ApiErrors` next-intl namespace. Keeps error
 * handling consistent across every dashboard form (BRD feedback #4).
 *
 * Server validation returns translation keys as the error message (e.g.
 * `TITLE_TOO_SHORT`) and a `code` (e.g. `VALIDATION_ERROR`, `CONFLICT`). We try
 * the code first (unless it is the generic `VALIDATION_ERROR`), then the
 * message, falling back to the raw message or a provided default.
 */
export type ApiErrorTranslate = (key: string) => string;

export function resolveApiErrorMessage(
  tErr: ApiErrorTranslate,
  code: string | undefined,
  message: string | undefined,
  fallback: string,
): string {
  const key = code && code !== "VALIDATION_ERROR" ? code : message;
  if (key) {
    try {
      const translated = tErr(key);
      if (translated && translated !== key) return translated;
    } catch {
      /* unknown key — fall through */
    }
  }
  return message ?? fallback;
}
