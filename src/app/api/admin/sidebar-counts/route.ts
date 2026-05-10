import { requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { handleError, ok } from "../../_lib/http";

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const [
      countries,
      organizations,
      activities,
      activityTypes,
      activitySubtypes,
      users,
    ] = await Promise.all([
      prisma.country.count(),
      prisma.organization.count(),
      prisma.activity.count(),
      prisma.activityType.count(),
      prisma.activitySubtype.count(),
      prisma.user.count(),
    ]);

    return ok({
      countries,
      organizations,
      activities,
      activityTypes,
      activitySubtypes,
      users,
    });
  } catch (err) {
    return handleError(err);
  }
}
