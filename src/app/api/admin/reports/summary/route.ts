import { requireApiUser } from "@/lib/auth/require-api-user";
import { prisma } from "@/lib/prisma";

import { handleError, ok } from "../../../_lib/http";
import { REPORT_DEFINITIONS, type ReportId } from "../_lib/report-types";

const REFERENCE_YEAR = 2026;

async function reportCount(id: ReportId): Promise<number> {
  if (id === "year-2026") {
    return prisma.activity.count({
      where: {
        dateParsed: {
          gte: new Date(Date.UTC(REFERENCE_YEAR, 0, 1)),
          lte: new Date(Date.UTC(REFERENCE_YEAR, 11, 31, 23, 59, 59)),
        },
      },
    });
  }
  if (id === "upcoming") {
    return prisma.activity.count({
      where: {
        dateParsed: { gte: new Date(Date.UTC(REFERENCE_YEAR + 1, 0, 1)) },
      },
    });
  }
  if (id === "by-country") {
    return prisma.activity.count({ where: { countryId: { not: null } } });
  }
  if (id === "by-organization") {
    return prisma.activity.count({
      where: { organizationId: { not: null } },
    });
  }
  return prisma.activity.count();
}

export async function GET() {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const ids = Object.keys(REPORT_DEFINITIONS) as ReportId[];
    const counts = await Promise.all(ids.map(reportCount));
    return ok({
      reports: ids.map((id, idx) => ({ id, count: counts[idx] })),
    });
  } catch (err) {
    return handleError(err);
  }
}
