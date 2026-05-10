import { randomBytes } from "crypto";

import { NextRequest } from "next/server";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiRole, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { created, handleError, ok } from "../../_lib/http";
import { activityTypeCreate } from "../../_lib/validators";

const KEY_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

function generateActivityTypeKey(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += KEY_ALPHABET[bytes[i] & 31];
  }
  return out;
}

async function nextUniqueActivityTypeKey(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const key = generateActivityTypeKey();
    const existing = await prisma.activityType.findUnique({ where: { key } });
    if (!existing) return key;
  }
  return generateActivityTypeKey(12);
}

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const items = await prisma.activityType.findMany({
      orderBy: { id: "asc" },
      include: {
        subtypes: { orderBy: { labelAr: "asc" } },
        _count: { select: { activities: true } },
      },
    });
    return ok({ items });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiRole(["admin", "editor"]);
    if (!auth.ok) return auth.response;
    const body = activityTypeCreate.parse(await req.json());
    const key = await nextUniqueActivityTypeKey();
    const row = await prisma.activityType.create({ data: { ...body, key } });
    await auditFromRequest(req, {
      action: "RESOURCE_CREATED",
      userId: auth.user.id,
      resource: "activity-type",
      resourceId: row.id,
      metadata: { labelEn: row.labelEn },
    });
    return created(row);
  } catch (err) {
    return handleError(err);
  }
}
