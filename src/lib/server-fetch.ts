/**
 * Server-side fetch wrapper that forwards the session cookie.
 *
 * Use this in server components that call our own `/api/*` routes — the
 * native `fetch` does NOT forward cookies, so without this the API would
 * see the request as unauthenticated.
 *
 * The `next/headers` import is dynamic so this module can be transitively
 * pulled into client bundles without breaking the build (the function body
 * is still only ever executed on the server).
 */
export async function serverFetch(
  url: string,
  init: RequestInit = {}
): Promise<Response> {
  const { cookies } = await import("next/headers");
  const cookieHeader = (await cookies()).toString();
  const headers = new Headers(init.headers);
  if (cookieHeader && !headers.has("cookie")) {
    headers.set("cookie", cookieHeader);
  }
  return fetch(url, {
    cache: "no-store",
    ...init,
    headers,
  });
}
