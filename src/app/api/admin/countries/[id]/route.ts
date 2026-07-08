import { NextRequest } from "next/server";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiPermission, requireApiUser } from "@/lib/auth/require-api-user";
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
    const auth = await requireApiPermission("countries", "update");
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
    const auth = await requireApiPermission("countries", "delete");
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const target = await prisma.country.findUnique({
      where: { id },
      select: { code: true, nameEn: true },
    });
    if (!target) return notFound("Country");

    // BRD feedback #7: do not orphan activities on delete. Block deletion when
    // related activities exist unless the caller passes ?transferTo=<countryId>
    // to move them first.
    const activityCount = await prisma.activity.count({ where: { countryId: id } });
    const transferTo = parseId(req.nextUrl.searchParams.get("transferTo") ?? "");

    if (activityCount > 0) {
      if (!transferTo) {
        return fail("COUNTRY_HAS_ACTIVITIES", 409, "HAS_ACTIVITIES", {
          activityCount,
        });
      }
      if (transferTo === id) {
        return fail("TRANSFER_TARGET_INVALID", 400, "TRANSFER_TARGET_INVALID");
      }
      const dest = await prisma.country.findUnique({
        where: { id: transferTo },
        select: { id: true },
      });
      if (!dest) {
        return fail("TRANSFER_TARGET_NOT_FOUND", 404, "TRANSFER_TARGET_NOT_FOUND");
      }
      await prisma.$transaction([
        prisma.activity.updateMany({
          where: { countryId: id },
          data: { countryId: transferTo },
        }),
        prisma.country.delete({ where: { id } }),
      ]);
    } else {
      await prisma.country.delete({ where: { id } });
    }

    await auditFromRequest(req, {
      action: "RESOURCE_DELETED",
      userId: auth.user.id,
      resource: "country",
      resourceId: id,
      metadata: {
        code: target.code,
        nameEn: target.nameEn,
        transferredActivities: activityCount,
        transferTo: transferTo ?? null,
      },
    });
    return ok({ id, transferredActivities: activityCount });
  } catch (err) {
    return handleError(err);
  }
}
