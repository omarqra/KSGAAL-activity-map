import { NextRequest } from "next/server";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiRole, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { fail, handleError, notFound, ok, parseId } from "../../../_lib/http";
import { countryUpdate } from "../../../_lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const row = await prisma.country.findUnique({
      where: { id },
      include: {
        activities: {
          include: { type: true, subtype: true },
          orderBy: { dateParsed: "desc" },
        },
        organizations: true,
      },
    });
    if (!row) return notFound("Country");
    return ok(row);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiRole(["admin", "editor"]);
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const body = countryUpdate.parse(await req.json());
    const row = await prisma.country.update({ where: { id }, data: body });
    await auditFromRequest(req, {
      action: "RESOURCE_UPDATED",
      userId: auth.user.id,
      resource: "country",
      resourceId: row.id,
      metadata: { fields: Object.keys(body) },
    });
    return ok(row);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiRole(["admin", "editor"]);
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const target = await prisma.country.findUnique({
      where: { id },
      select: { code: true, nameEn: true },
    });
    await prisma.country.delete({ where: { id } });
    await auditFromRequest(req, {
      action: "RESOURCE_DELETED",
      userId: auth.user.id,
      resource: "country",
      resourceId: id,
      metadata: target ? { code: target.code, nameEn: target.nameEn } : undefined,
    });
    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
