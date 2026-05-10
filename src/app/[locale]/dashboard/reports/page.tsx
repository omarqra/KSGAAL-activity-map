import { FileBarChart, FileSpreadsheet, FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";

import { type KpiItem, KpiStrip } from "../_components/shared";
import { ReportCard } from "./_components/report-card";
import { type ReportSummary, fetchReportsSummary } from "./_lib/api";
import { REPORT_IDS } from "./_lib/report-catalog";

const EMPTY_SUMMARY: ReportSummary = { reports: [] };

function findCount(summary: ReportSummary, id: string): number {
  return summary.reports.find((r) => r.id === id)?.count ?? 0;
}

export default async function ReportsPage() {
  const t = await getTranslations("ReportsPage");
  const summary = await fetchReportsSummary().catch(() => EMPTY_SUMMARY);

  const totalActivities = findCount(summary, "all");
  const yearActivities = findCount(summary, "year-2026");
  const upcomingActivities = findCount(summary, "upcoming");

  const kpis: KpiItem[] = [
    {
      icon: FileBarChart,
      iconColor: "#0972D3",
      label: t("kpiTotalReports"),
      value: REPORT_IDS.length,
      description: t("kpiTotalReportsDesc"),
    },
    {
      icon: FileSpreadsheet,
      iconColor: "#7AA116",
      label: t("kpiTotalActivities"),
      value: totalActivities.toLocaleString("en-US"),
      description: t("kpiTotalActivitiesDesc"),
    },
    {
      icon: FileText,
      iconColor: "#D56028",
      label: t("kpiThisYear"),
      value: yearActivities.toLocaleString("en-US"),
      description: t("kpiThisYearDesc", { count: upcomingActivities }),
    },
  ];

  return (
    <>
      <PageHeader
        meta={t("meta")}
        title={t("title")}
        description={t("description")}
      />

      <div className="mx-6 mb-4">
        <KpiStrip items={kpis} />
      </div>

      <div className="space-y-4 px-6 pb-8">
        <h2 className="text-aws-text2 text-[11px] font-bold tracking-wider uppercase">
          {t("availableReports")}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REPORT_IDS.map((id) => (
            <ReportCard key={id} id={id} count={findCount(summary, id)} />
          ))}
        </div>
      </div>
    </>
  );
}

