import { NextResponse } from "next/server";

import {
  type Action,
  type PermissionMap,
  type Resource,
  ROLE_PRESETS,
  can,
  normalizePermissions,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import { getCurrentSession } from "./session";

export type ApiAuthenticatedUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
  roleId: number | null;
  permissions: PermissionMap;
};

export type ApiAuthOk = { ok: true; user: ApiAuthenticatedUser };
export type ApiAuthFail = { ok: false; response: NextResponse };
export type ApiAuthResult = ApiAuthOk | ApiAuthFail;

function unauthorized(): NextResponse {
  return NextResponse.json(
    { data: null, error: { message: "unauthorized", code: "UNAUTHORIZED" } },
    { status: 401 }
  );
}

function forbidden(): NextResponse {
  return NextResponse.json(
    { data: null, error: { message: "forbidden", code: "FORBIDDEN" } },
    { status: 403 }
  );
}

/**
 * Authenticate an admin API request using the session cookie.
 * Returns `{ ok: true, user }` on success, or `{ ok: false, response }`
 * with a 401 NextResponse the route handler should return immediately.
 */
export async function requireApiUser(): Promise<ApiAuthResult> {
  const session = await getCurrentSession();
  if (!session) {
    return { ok: false, response: unauthorized() };
  }

  const id = Number(session.sub);
  if (!Number.isFinite(id)) {
    return { ok: false, response: unauthorized() };
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
    return { ok: false, response: unauthorized() };
  }

  // Effective permissions: prefer the linked role's stored map; fall back to the
  // preset for the legacy role string so users without a roleId still work.
  const permissions = user.roleRef
    ? normalizePermissions(user.roleRef.permissions)
    : (ROLE_PRESETS[user.role]?.permissions ?? {});

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roleId: user.roleId,
      permissions,
    },
  };
}

/**
 * Authenticate + authorize by permission. The user's effective permissions must
 * grant `action` on `resource`. Returns 401 if unauthenticated, 403 otherwise.
 */
export async function requireApiPermission(
  resource: Resource,
  action: Action
): Promise<ApiAuthResult> {
  const result = await requireApiUser();
  if (!result.ok) return result;
  if (!can(result.user.permissions, resource, action)) {
    return { ok: false, response: forbidden() };
  }
  return result;
}

/**
 * Authenticate + authorize: the user must be active AND their role must be
 * one of `allowedRoles`. Returns 401 if unauthenticated, 403 if role mismatch.
 */
export async function requireApiRole(
  allowedRoles: readonly string[]
): Promise<ApiAuthResult> {
  const result = await requireApiUser();
  if (!result.ok) return result;
  if (!allowedRoles.includes(result.user.role)) {
    return { ok: false, response: forbidden() };
  }
  return result;
}
