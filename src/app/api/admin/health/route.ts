import { requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { fail, ok } from "../../_lib/http";

export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({
      status: "ok",
      database: "connected",
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return fail("Database unreachable", 503, "DB_DOWN", {
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
    });
  }
}
