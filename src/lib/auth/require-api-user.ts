import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

import { getCurrentSession } from "./session";

export type ApiAuthenticatedUser = {
  id: number;
  email: string;
  name: string | null;
  role: string;
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
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return { ok: false, response: unauthorized() };
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
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
