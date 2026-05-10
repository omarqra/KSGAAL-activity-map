import { useRouter } from "@/i18n/routing";

import type { ValidHref } from "./routing";

type PushFunction = ReturnType<typeof useRouter>["push"];

/** Converts ValidHref to a string suitable for React keys */
export const hrefToKey = (href: ValidHref): string =>
  typeof href === "string" ? href : href.pathname;

function resolvePathWithParams(
  pathname: string,
  params?: Record<string, string | number>
): string {
  if (!params) return pathname;
  let path = pathname;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`[${key}]`, String(value));
  }
  return path;
}

export function getStringPathFromHref(href: ValidHref): string {
  if (typeof href === "string") {
    return href.split("?")[0];
  }
  const pathname = href.pathname;
  const params =
    "params" in href && href.params != null
      ? (href.params as Record<string, string | number>)
      : undefined;
  return resolvePathWithParams(pathname, params);
}

export const normalizeHrefForRouter = (
  href: ValidHref
): Parameters<PushFunction>[0] => {
  if (typeof href === "string") {
    return href;
  }

  const { query, ...rest } = href;
  const shouldDropQuery =
    query == null || typeof query === "string" || Array.isArray(query);

  if (shouldDropQuery) {
    return rest as Parameters<PushFunction>[0];
  }

  return { ...rest, query } as Parameters<PushFunction>[0];
};
