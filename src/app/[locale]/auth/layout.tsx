import type { ReactNode } from "react";

/**
 * Auth pages (login, OTP) share the dashboard's font scope so the user's
 * font choice — persisted via the dashboard's font switcher — applies
 * here too.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div data-app="dashboard">{children}</div>;
}
