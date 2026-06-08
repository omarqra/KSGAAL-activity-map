import { Locale, redirect } from "@/i18n/routing";
import { type Action, type Resource, can } from "@/lib/permissions";

import { requireUser } from "./require-user";

/**
 * Page-level RBAC guard. Authenticates the user (redirecting to login when
 * needed) and redirects to the dashboard home when they lack `action` on
 * `resource`, so a user can't reach a page by typing its URL directly even
 * though its sidebar link is hidden.
 */
export async function requirePageAccess(
  locale: string,
  resource: Resource,
  action: Action,
  fromPath?: string,
) {
  const user = await requireUser(locale, fromPath);
  if (!can(user.permissions, resource, action)) {
    // Dashboard routes are not in the localized pathnames map; cast like the
    // login redirect does elsewhere in the app.
    redirect({ href: "/dashboard" as never, locale: locale as Locale });
  }
  return user;
}
