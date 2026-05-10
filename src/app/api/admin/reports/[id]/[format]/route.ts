import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/lib/auth/require-api-user";

import { fail, handleError } from "../../../../_lib/http";
import { generateDocx } from "../../_lib/docx-generator";
import { buildReport } from "../../_lib/report-data";
import {
  isReportFormat,
  isReportId,
  type ReportLocale,
} from "../../_lib/report-types";
import { generateXlsx } from "../../_lib/xlsx-generator";

type Ctx = { params: Promise<{ id: string; format: string }> };

const MIME: Record<"xlsx" | "docx", string> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function pickLocale(req: NextRequest): ReportLocale {
  const param = req.nextUrl.searchParams.get("locale");
  if (param === "en" || param === "ar") return param;
  return "ar";
}

function makeFilename(reportId: string, format: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `report-${reportId}-${stamp}.${format}`;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const auth = await requireApiUser();
    if (!auth.ok) return auth.response;
    const { id, format } = await params;
    if (!isReportId(id)) return fail("Unknown report id", 404);
    if (!isReportFormat(format)) {
      return fail("Unsupported format", 400);
    }

    const locale = pickLocale(req);
    const payload = await buildReport(id, locale);
    const buffer =
      format === "xlsx"
        ? await generateXlsx(payload)
        : await generateDocx(payload);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": MIME[format],
        "Content-Disposition": `attachment; filename="${makeFilename(id, format)}"`,
        "Cache-Control": "no-store",
        "Content-Length": String(buffer.length),
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
