/**
 * Base URL a server component should use to call this app's own `/api/*`
 * routes.
 *
 * Several dashboard screens are server components that fetch their own API
 * over HTTP. They used to build that URL from `NEXT_PUBLIC_FRONTEND_URL`,
 * which sent the request out of the container, through DNS and the ingress,
 * and back into the same process. That is slow everywhere and simply does not
 * work on the academy's cluster: its nodes have no outbound internet and the
 * pod cannot resolve the public hostname, so those screens would have failed
 * even after the real hostname arrived.
 *
 * Talking to loopback removes the round trip and the dependency on any
 * hostname at all, so the same image works behind a temporary node port, a
 * real ingress, or a developer's laptop with no rebuild.
 *
 * Server-side only — a browser has nothing on its own loopback.
 */
export function internalBaseUrl(): string {
  return `http://127.0.0.1:${process.env.PORT ?? "3000"}`;
}
