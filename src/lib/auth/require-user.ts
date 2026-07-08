import { Locale, redirect } from "@/i18n/routing";
import {
  type PermissionMap,
  ROLE_PRESETS,
  normalizePermissions,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import { getCurrentSession } from "./session";

export type AuthenticatedUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  roleId: number | null;
  permissions: PermissionMap;
};

function redirectToLogin(locale: string, from?: string): never {
  redirect({
    href: { pathname: "/auth/login", query: from ? { from } : undefined },
    locale: locale as Locale,
  });
  throw new Error("unreachable: redirect did not stop execution");
}

export async function requireUser(
  locale: string,
  fromPath?: string
): Promise<AuthenticatedUser> {
  const session = await getCurrentSession();
  if (!session) {
    redirectToLogin(locale, fromPath);
  }

  const id = Number(session.sub);
  if (!Number.isFinite(id)) {
    redirectToLogin(locale, fromPath);
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      roleId: true,
      isActive: true,
      roleRef: { select: { permissions: true } },
    },
  });

  if (!user || !user.isActive) {
    redirectToLogin(locale, fromPath);
  }

  const permissions = user.roleRef
    ? normalizePermissions(user.roleRef.permissions)
    : (ROLE_PRESETS[user.role]?.permissions ?? {});

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    roleId: user.roleId,
    permissions,
  };
}
