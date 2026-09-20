import { NextResponse } from "next/server";

import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { sanitizeError } from "@/lib/log/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  /* No DATABASE_URL is a deliberate deployment mode, not a fault. Returning
     503 here would make Kubernetes hold the pod out of service forever and
     the rollout would never complete, so the app could not be demonstrated
     at all while the academy provisions a database. A database that IS
     configured but unreachable still fails the probe below — that is a real
     fault and should keep traffic away. */
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        status: "degraded",
        service: "ksgaal-activity-map",
        check: "ready",
        database: "not-configured",
      },
      { status: 200 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      {
        status: "ok",
        service: "ksgaal-activity-map",
        check: "ready",
        database: "connected",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[health/ready] database unreachable", sanitizeError(err));
    return NextResponse.json(
      {
        status: "error",
        service: "ksgaal-activity-map",
        check: "ready",
        database: "disconnected",
      },
      { status: 503 }
    );
  }
}
