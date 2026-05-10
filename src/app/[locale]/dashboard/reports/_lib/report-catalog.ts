import {
  Building2,
  CalendarRange,
  FileText,
  Flag,
  Layers,
  type LucideIcon,
  Sparkles,
} from "lucide-react";

export type ReportId =
  | "all"
  | "by-type"
  | "by-country"
  | "by-organization"
  | "year-2026"
  | "upcoming";

export interface ReportCatalogEntry {
  id: ReportId;
  /** i18n key under `ReportsPage.reports.<id>.title`. */
  titleKey: string;
  descriptionKey: string;
  icon: LucideIcon;
  /** AWS-inspired accent for the icon tile. */
  accent: string;
}

export const REPORT_IDS: ReportId[] = [
  "all",
  "by-type",
  "by-country",
  "by-organization",
  "year-2026",
  "upcoming",
];

export function getReportCatalogEntry(id: ReportId): ReportCatalogEntry {
  const entry = REPORT_CATALOG.find((c) => c.id === id);
  if (!entry) throw new Error(`Unknown report id: ${id}`);
  return entry;
}

export const REPORT_CATALOG: ReportCatalogEntry[] = [
  {
    id: "all",
    titleKey: "reports.all.title",
    descriptionKey: "reports.all.description",
    icon: FileText,
    accent: "#0972D3",
  },
  {
    id: "by-type",
    titleKey: "reports.by-type.title",
    descriptionKey: "reports.by-type.description",
    icon: Layers,
    accent: "#8C4FFF",
  },
  {
    id: "by-country",
    titleKey: "reports.by-country.title",
    descriptionKey: "reports.by-country.description",
    icon: Flag,
    accent: "#7AA116",
  },
  {
    id: "by-organization",
    titleKey: "reports.by-organization.title",
    descriptionKey: "reports.by-organization.description",
    icon: Building2,
    accent: "#D56028",
  },
  {
    id: "year-2026",
    titleKey: "reports.year-2026.title",
    descriptionKey: "reports.year-2026.description",
    icon: CalendarRange,
    accent: "#0972D3",
  },
  {
    id: "upcoming",
    titleKey: "reports.upcoming.title",
    descriptionKey: "reports.upcoming.description",
    icon: Sparkles,
    accent: "#D13212",
  },
];

