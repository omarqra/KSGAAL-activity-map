import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import type { TopCountriesResponse } from "../_lib/api";
import { TopVisitedCountriesTable } from "./top-visited-countries-table";

interface TopVisitedLabels {
  summaryTotalLabel: string;
  summaryDistributedPrefix: string;
  summaryDistributedSuffix: string;
  summaryQuickIndicators: string;
  summaryCountriesCount: string;
  summaryTopCountry: string;
  summaryTopActivities: string;
}

interface TopVisitedCountriesCardProps {
  data: TopCountriesResponse;
}

export async function TopVisitedCountriesCard({
  data,
}: TopVisitedCountriesCardProps) {
  const t = await getTranslations("OverviewPage");
  const { items, total, distinctCount, topCountry } = data;

  const labels: TopVisitedLabels = {
    summaryTotalLabel: t("summaryTotalLabel"),
    summaryDistributedPrefix: t("summaryDistributedPrefix"),
    summaryDistributedSuffix: t("summaryDistributedSuffix"),
    summaryQuickIndicators: t("summaryQuickIndicators"),
    summaryCountriesCount: t("summaryCountriesCount"),
    summaryTopCountry: t("summaryTopCountry"),
    summaryTopActivities: t("summaryTopActivities"),
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">{t("mostActiveTitle")}</span>
      }
      description={t("mostActiveDescription")}
      action={
        <div className="flex items-center gap-3">
          <div className="text-aws-text3 text-[12px]">
            {t("totalActivitiesPrefix")}{" "}
            <Badge variant="info" className="num">
              {total.toLocaleString("en-US")}
            </Badge>
          </div>
        </div>
      }
      bodyClassName="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <VisitorsSummary
        totalActivities={total}
        countriesCount={distinctCount}
        topCountryName={topCountry?.nameAr ?? "—"}
        topCountryActivities={topCountry?.count ?? 0}
        labels={labels}
      />
      <TopVisitedCountriesTable
        rows={items}
        labels={{
          colRank: t("colRank"),
          colCountry: t("colCountry"),
          colActivities: t("colActivities"),
          colShare: t("colShare"),
          colDistribution: t("colDistribution"),
          emptyState: t("emptyState"),
        }}
      />
    </Card>
  );
}

interface VisitorsSummaryProps {
  totalActivities: number;
  countriesCount: number;
  topCountryName: string;
  topCountryActivities: number;
  labels: TopVisitedLabels;
}

function VisitorsSummary({
  totalActivities,
  countriesCount,
  topCountryName,
  topCountryActivities,
  labels,
}: VisitorsSummaryProps) {
  return (
    <div className="flex flex-col gap-3 lg:col-span-1">
      <div className="border-aws-border2 rounded-md border p-4">
        <div className="text-aws-text3 text-[12px]">
          {labels.summaryTotalLabel}
        </div>
        <div className="kpi-num num mt-1">
          {totalActivities.toLocaleString("en-US")}
        </div>
        <div className="text-aws-text2 mt-1 text-[12px]">
          {labels.summaryDistributedPrefix}{" "}
          <span className="num text-aws-text font-semibold">
            {countriesCount}
          </span>{" "}
          {labels.summaryDistributedSuffix}
        </div>
      </div>
      <div className="border-aws-border2 rounded-md border p-4">
        <div className="text-aws-text3 mb-2 text-[12px]">
          {labels.summaryQuickIndicators}
        </div>
        <div className="space-y-2">
          <SummaryRow
            label={labels.summaryCountriesCount}
            value={<span className="num">{countriesCount}</span>}
          />
          <SummaryRow label={labels.summaryTopCountry} value={topCountryName} />
          <SummaryRow
            label={labels.summaryTopActivities}
            value={
              <span className="num">
                {topCountryActivities.toLocaleString("en-US")}
              </span>
            }
          />
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-aws-text2">{label}</span>
      <span className="num font-semibold">{value}</span>
    </div>
  );
}
