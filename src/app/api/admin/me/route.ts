import { requireApiUser } from "@/lib/auth/require-api-user";

import { handleError, ok } from "../../_lib/http";

/** Current authenticated admin user with effective RBAC permissions. */
export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const { id, email, name, role, roleId, permissions } = auth.user;
    return ok({ id, email, name, role, roleId, permissions });
  } catch (err) {
    return handleError(err);
  }
}
