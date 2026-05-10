import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  REPORT_DEFINITIONS,
  type ReportGroup,
  type ReportId,
  type ReportLocale,
  type ReportPayload,
  type ReportRow,
} from "./report-types";

const REFERENCE_YEAR = 2026;

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  upcoming: { ar: "قادم", en: "Upcoming" },
  active: { ar: "جارٍ", en: "Ongoing" },
  completed: { ar: "مكتمل", en: "Completed" },
  tbd: { ar: "غير محدد", en: "Undefined" },
};

const ACTIVITY_INCLUDE = {
  type: true,
  subtype: true,
  country: { select: { id: true, code: true, nameAr: true, nameEn: true } },
  organization: {
    select: { id: true, code: true, nameAr: true, nameEn: true },
  },
} satisfies Prisma.ActivityInclude;

type ApiActivity = Prisma.ActivityGetPayload<{ include: typeof ACTIVITY_INCLUDE }>;

function pick(ar: string | null, en: string | null, locale: ReportLocale) {
  if (locale === "en") return en ?? ar ?? "";
  return ar ?? en ?? "";
}

function deriveStatus(
  dateText: string | null,
  year: number | null
): keyof typeof STATUS_LABELS {
  if (!dateText && year == null) return "tbd";
  if (dateText && /غير\s*محدد/.test(dateText)) return "tbd";
  if (year == null) return "tbd";
  if (year > REFERENCE_YEAR) return "upcoming";
  if (year === REFERENCE_YEAR) return "active";
  return "completed";
}

function extractYearFromText(date: string | null): number | null {
  if (!date) return null;
  const m = date.match(/(19|20)\d{2}/g);
  if (!m) return null;
  return m.map(Number).sort((a, b) => b - a)[0];
}

function toReportRow(
  activity: ApiActivity,
  locale: ReportLocale,
  serial: number
): ReportRow {
  const year =
    extractYearFromText(activity.dateText) ??
    (activity.dateParsed ? activity.dateParsed.getUTCFullYear() : null);
  const status = deriveStatus(activity.dateText, year);

  let hostKind: ReportRow["hostKind"] = "none";
  let hostName = "—";
  let hostCode = "—";
  if (activity.country) {
    hostKind = "country";
    hostName = pick(activity.country.nameAr, activity.country.nameEn, locale);
    hostCode = `cnt-${activity.country.code}`;
  } else if (activity.organization) {
    hostKind = "organization";
    hostName = pick(
      activity.organization.nameAr,
      activity.organization.nameEn,
      locale
    );
    hostCode = `org-${activity.organization.code}`;
  }

  return {
    id: activity.id,
    serial,
    name: activity.name,
    type: pick(activity.type.labelAr, activity.type.labelEn, locale),
    subtype: activity.subtype
      ? pick(activity.subtype.labelAr, activity.subtype.labelEn, locale)
      : null,
    date: activity.dateText ?? "—",
    status: STATUS_LABELS[status][locale],
    hostKind,
    hostName,
    hostCode,
    year,
  };
}

function whereForReport(id: ReportId): Prisma.ActivityWhereInput {
  if (id === "year-2026") {
    return {
      dateParsed: {
        gte: new Date(Date.UTC(REFERENCE_YEAR, 0, 1)),
        lte: new Date(Date.UTC(REFERENCE_YEAR, 11, 31, 23, 59, 59)),
      },
    };
  }
  if (id === "upcoming") {
    return {
      dateParsed: { gte: new Date(Date.UTC(REFERENCE_YEAR + 1, 0, 1)) },
    };
  }
  return {};
}

function groupBy<T>(
  rows: T[],
  keyFn: (row: T) => { key: string; label: string }
): ReportGroup[] {
  const map = new Map<string, ReportGroup>();
  for (const row of rows) {
    const { key, label } = keyFn(row);
    const existing = map.get(key) ?? { key, label, count: 0, rows: [] };
    existing.rows.push(row as unknown as ReportRow);
    existing.count += 1;
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

function buildGroups(
  id: ReportId,
  rows: ReportRow[],
  locale: ReportLocale
): ReportGroup[] {
  if (id === "by-type") {
    return groupBy(rows, (r) => ({ key: r.type, label: r.type }));
  }
  if (id === "by-country") {
    const filtered = rows.filter((r) => r.hostKind === "country");
    const noneLabel = locale === "en" ? "Unassigned" : "غير محدد";
    if (filtered.length === 0) {
      return [{ key: "none", label: noneLabel, count: 0, rows: [] }];
    }
    return groupBy(filtered, (r) => ({ key: r.hostCode, label: r.hostName }));
  }
  if (id === "by-organization") {
    const filtered = rows.filter((r) => r.hostKind === "organization");
    return groupBy(filtered, (r) => ({ key: r.hostCode, label: r.hostName }));
  }
  return [];
}

export async function buildReport(
  id: ReportId,
  locale: ReportLocale
): Promise<ReportPayload> {
  const def = REPORT_DEFINITIONS[id];
  const activities = await prisma.activity.findMany({
    where: whereForReport(id),
    orderBy: [{ dateParsed: "desc" }, { id: "desc" }],
    include: ACTIVITY_INCLUDE,
  });

  const rows = activities.map((a, idx) => toReportRow(a, locale, idx + 1));
  const groups = def.grouped ? buildGroups(id, rows, locale) : undefined;

  return {
    id,
    title: locale === "en" ? def.titleEn : def.titleAr,
    description: locale === "en" ? def.descriptionEn : def.descriptionAr,
    generatedAt: new Date().toISOString(),
    locale,
    totalCount: rows.length,
    rows: def.grouped ? undefined : rows,
    groups,
  };
}
