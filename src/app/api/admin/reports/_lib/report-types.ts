export type ReportId =
  | "all"
  | "by-type"
  | "by-country"
  | "by-organization"
  | "year-2026"
  | "upcoming";

export type ReportFormat = "xlsx" | "docx";

export type ReportLocale = "ar" | "en";

export const REPORT_IDS: ReportId[] = [
  "all",
  "by-type",
  "by-country",
  "by-organization",
  "year-2026",
  "upcoming",
];

export interface ReportRow {
  /** DB primary key — kept for reference. */
  id: number;
  /** Display ordinal (1..N) within the report or group. */
  serial: number;
  name: string;
  type: string;
  subtype: string | null;
  date: string;
  status: string;
  hostKind: "country" | "organization" | "none";
  hostName: string;
  hostCode: string;
  year: number | null;
}

export interface ReportGroup {
  key: string;
  label: string;
  count: number;
  rows: ReportRow[];
}

export interface ReportPayload {
  id: ReportId;
  /** Localized title (resolved server-side from request locale). */
  title: string;
  /** Localized one-liner under the title. */
  description: string;
  /** ISO timestamp of generation. */
  generatedAt: string;
  /** Locale used for content. Drives RTL flags in generators. */
  locale: ReportLocale;
  /** Total activity count covered by the report. */
  totalCount: number;
  /** Flat rows — set for non-grouped reports. */
  rows?: ReportRow[];
  /** Grouped rows — set for "by-X" reports. */
  groups?: ReportGroup[];
}

export interface ReportDefinition {
  id: ReportId;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  /** Whether the report is grouped (one section per group) or a flat table. */
  grouped: boolean;
}

export const REPORT_DEFINITIONS: Record<ReportId, ReportDefinition> = {
  all: {
    id: "all",
    titleAr: "تقرير الأنشطة الكامل",
    titleEn: "Full Activities Report",
    descriptionAr: "جميع الأنشطة المسجّلة في النظام بكل حقولها.",
    descriptionEn: "Every activity recorded in the system with all fields.",
    grouped: false,
  },
  "by-type": {
    id: "by-type",
    titleAr: "تقرير الأنشطة حسب النوع",
    titleEn: "Activities by Type",
    descriptionAr: "الأنشطة مجمَّعة تحت كل نوع رئيسي مع عدد كل مجموعة.",
    descriptionEn: "Activities grouped under each main type with counts.",
    grouped: true,
  },
  "by-country": {
    id: "by-country",
    titleAr: "تقرير الأنشطة حسب الدولة",
    titleEn: "Activities by Country",
    descriptionAr: "الأنشطة مجمَّعة لكل دولة، بالترتيب من الأكثر نشاطاً.",
    descriptionEn: "Activities grouped per country, ordered by volume.",
    grouped: true,
  },
  "by-organization": {
    id: "by-organization",
    titleAr: "تقرير الأنشطة حسب المنظمة",
    titleEn: "Activities by Organization",
    descriptionAr: "الأنشطة المرتبطة بكل منظمة شريكة.",
    descriptionEn: "Activities linked to each partner organization.",
    grouped: true,
  },
  "year-2026": {
    id: "year-2026",
    titleAr: "أنشطة عام 2026",
    titleEn: "2026 Activities",
    descriptionAr: "كل ما هو مجدول أو منفّذ خلال عام 2026.",
    descriptionEn: "Everything scheduled or executed during 2026.",
    grouped: false,
  },
  upcoming: {
    id: "upcoming",
    titleAr: "الأنشطة القادمة",
    titleEn: "Upcoming Activities",
    descriptionAr: "الأنشطة المخطّطة بعد عام 2026.",
    descriptionEn: "Activities planned after 2026.",
    grouped: false,
  },
};

export function isReportId(v: string): v is ReportId {
  return (REPORT_IDS as string[]).includes(v);
}

export function isReportFormat(v: string): v is ReportFormat {
  return v === "xlsx" || v === "docx";
}
