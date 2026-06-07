import { NextRequest } from "next/server";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiRole, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { fail, handleError, notFound, ok, parseId } from "../../../_lib/http";
import { organizationUpdate } from "../../../_lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const row = await prisma.organization.findUnique({
      where: { id },
      include: {
        country: true,
        activities: {
          include: { type: true, subtype: true },
          orderBy: { dateParsed: "desc" },
        },
      },
    });
    if (!row) return notFound("Organization");
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
    const body = organizationUpdate.parse(await req.json());
    const row = await prisma.organization.update({ where: { id }, data: body });
    await auditFromRequest(req, {
      action: "RESOURCE_UPDATED",
      userId: auth.user.id,
      resource: "organization",
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
    const target = await prisma.organization.findUnique({
      where: { id },
      select: { nameEn: true, kind: true },
    });
    if (!target) return notFound("Organization");

    // BRD feedback #7: block deletion when related activities exist unless the
    // caller passes ?transferTo=<organizationId> to move them first.
    const activityCount = await prisma.activity.count({
      where: { organizationId: id },
    });
    const transferTo = parseId(req.nextUrl.searchParams.get("transferTo") ?? "");

    if (activityCount > 0) {
      if (!transferTo) {
        return fail("ORGANIZATION_HAS_ACTIVITIES", 409, "HAS_ACTIVITIES", {
          activityCount,
        });
      }
      if (transferTo === id) {
        return fail("TRANSFER_TARGET_INVALID", 400, "TRANSFER_TARGET_INVALID");
      }
      const dest = await prisma.organization.findUnique({
        where: { id: transferTo },
        select: { id: true },
      });
      if (!dest) {
        return fail("TRANSFER_TARGET_NOT_FOUND", 404, "TRANSFER_TARGET_NOT_FOUND");
      }
      await prisma.$transaction([
        prisma.activity.updateMany({
          where: { organizationId: id },
          data: { organizationId: transferTo },
        }),
        prisma.organization.delete({ where: { id } }),
      ]);
    } else {
      await prisma.organization.delete({ where: { id } });
    }

    await auditFromRequest(req, {
      action: "RESOURCE_DELETED",
      userId: auth.user.id,
      resource: "organization",
      resourceId: id,
      metadata: {
        nameEn: target.nameEn,
        kind: target.kind,
        transferredActivities: activityCount,
        transferTo: transferTo ?? null,
      },
    });
    return ok({ id, transferredActivities: activityCount });
  } catch (err) {
    return handleError(err);
  }
}
