import { NextRequest } from "next/server";

import { auditFromRequest } from "@/lib/auth/audit";
import { requireApiPermission, requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { fail, handleError, notFound, ok, parseId } from "../../../_lib/http";
import { activityUpdate } from "../../../_lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const row = await prisma.activity.findUnique({
      where: { id },
      include: {
        type: true,
        subtype: true,
        country: true,
        organization: true,
      },
    });
    if (!row) return notFound("Activity");
    return ok(row);
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiPermission("activities", "update");
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const json = await req.json();
    // BRD feedback #10: optimistic concurrency. The client sends the
    // `expectedUpdatedAt` it loaded; if the row changed since, reject with 409
    // so the second editor reloads instead of silently overwriting.
    const expectedUpdatedAt =
      json && typeof json.expectedUpdatedAt === "string"
        ? new Date(json.expectedUpdatedAt)
        : null;
    const body = activityUpdate.parse(json);
    if (expectedUpdatedAt && !Number.isNaN(expectedUpdatedAt.getTime())) {
      const current = await prisma.activity.findUnique({
        where: { id },
        select: { updatedAt: true },
      });
      if (!current) return notFound("Activity");
      if (current.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        return fail("ACTIVITY_CONFLICT", 409, "CONFLICT", {
          currentUpdatedAt: current.updatedAt,
        });
      }
    }
    // Keep legacy columns in sync with new fields (BRD #22/#23 compat).
    const data: typeof body & {
      dateParsed?: Date | null;
      dateText?: string | null;
    } = { ...body };
    if (body.titleAr && body.name === undefined) {
      data.name = body.titleAr;
    }
    if (body.startDate !== undefined) {
      data.dateParsed = body.startDate ?? null;
      if (body.dateText === undefined) {
        data.dateText = body.startDate
          ? body.startDate.toISOString().slice(0, 10)
          : null;
      }
    }
    const row = await prisma.activity.update({ where: { id }, data });
    await auditFromRequest(req, {
      action: "RESOURCE_UPDATED",
      userId: auth.user.id,
      resource: "activity",
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
    const auth = await requireApiPermission("activities", "delete");
    if (!auth.ok) return auth.response;
    const id = parseId((await params).id);
    if (!id) return fail("Invalid id", 400);
    const target = await prisma.activity.findUnique({
      where: { id },
      select: { name: true, typeId: true },
    });
    await prisma.activity.delete({ where: { id } });
    await auditFromRequest(req, {
      action: "RESOURCE_DELETED",
      userId: auth.user.id,
      resource: "activity",
      resourceId: id,
      metadata: target ? { name: target.name, typeId: target.typeId } : undefined,
    });
    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}
