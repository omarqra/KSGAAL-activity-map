import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { sanitizeError } from "@/lib/log/sanitize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
