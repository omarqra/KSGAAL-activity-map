import { randomBytes } from "crypto";

import { NextRequest } from "next/server";

import { Prisma } from "@prisma/client";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiRole, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import {
  created,
  handleError,
  ok,
  parsePagination,
} from "../../_lib/http";
import {
  ENTITY_STATUSES,
  ORG_KINDS,
  organizationCreate,
} from "../../_lib/validators";

const CODE_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

function generateOrganizationCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] & 31];
  }
  return out;
}

async function nextUniqueOrganizationCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateOrganizationCode();
    const existing = await prisma.organization.findUnique({ where: { code } });
    if (!existing) return code;
  }
  return generateOrganizationCode(12);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const kind = sp.get("kind") ?? undefined;
    const status = sp.get("status") ?? undefined;
    const countryIdRaw = sp.get("countryId");
    const { page, pageSize, skip, take } = parsePagination(sp);

    const where: Prisma.OrganizationWhereInput = {};
    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { nameAr: { contains: q } },
        { nameEn: { contains: q, mode: "insensitive" } },
      ];
    }
    if (kind && (ORG_KINDS as readonly string[]).includes(kind)) {
      where.kind = kind;
    }
    if (status && (ENTITY_STATUSES as readonly string[]).includes(status)) {
      where.status = status;
    }
    if (countryIdRaw) {
      const cid = Number(countryIdRaw);
      if (Number.isInteger(cid) && cid > 0) where.countryId = cid;
    }

    const [items, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        orderBy: { nameAr: "asc" },
        skip,
        take,
        include: {
          country: true,
          _count: { select: { activities: true } },
        },
      }),
      prisma.organization.count({ where }),
    ]);

    return ok({ items, total, page, pageSize });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireApiRole(["admin", "editor"]);
    if (!auth.ok) return auth.response;
    const body = organizationCreate.parse(await req.json());
    const code = await nextUniqueOrganizationCode();
    const row = await prisma.organization.create({ data: { ...body, code } });
    await auditFromRequest(req, {
      action: "RESOURCE_CREATED",
      userId: auth.user.id,
      resource: "organization",
      resourceId: row.id,
      metadata: { nameEn: row.nameEn, kind: row.kind },
    });
    return created(row);
  } catch (err) {
    return handleError(err);
  }
}
