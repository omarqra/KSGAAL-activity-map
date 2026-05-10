"use client";

import { useMemo, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { TopCountryItem } from "../_lib/api";

const FLAG_BY_CODE: Record<string, string> = {
  sa: "🇸🇦",
  ae: "🇦🇪",
  eg: "🇪🇬",
  ma: "🇲🇦",
  jo: "🇯🇴",
  kw: "🇰🇼",
  qa: "🇶🇦",
  tn: "🇹🇳",
  bh: "🇧🇭",
  om: "🇴🇲",
  ye: "🇾🇪",
  iq: "🇮🇶",
  sy: "🇸🇾",
  lb: "🇱🇧",
  ps: "🇵🇸",
  sd: "🇸🇩",
  ly: "🇱🇾",
  dz: "🇩🇿",
  mr: "🇲🇷",
  so: "🇸🇴",
  dj: "🇩🇯",
  km: "🇰🇲",
  tr: "🇹🇷",
};

const PAGE_SIZE = 10;

interface CountriesTableLabels {
  colRank: string;
  colCountry: string;
  colActivities: string;
  colShare: string;
  colDistribution: string;
  emptyState: string;
}

interface TopVisitedCountriesTableProps {
  rows: TopCountryItem[];
  labels: CountriesTableLabels;
}

export function TopVisitedCountriesTable({
  rows,
  labels,
}: TopVisitedCountriesTableProps) {
  const t = useTranslations("OverviewPage");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, rows.length);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);

  if (rows.length === 0) {
    return (
      <div className="lg:col-span-2">
        <div className="text-aws-text3 px-4 py-8 text-center text-[13px]">
          {labels.emptyState}
        </div>
      </div>
    );
  }

  const top = rows[0].count || 1;
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="lg:col-span-2">
      <table className="aws-table">
        <thead>
          <tr>
            <th style={{ width: 32 }}>{labels.colRank}</th>
            <th>{labels.colCountry}</th>
            <th>{labels.colActivities}</th>
            <th>{labels.colShare}</th>
            <th style={{ width: 200 }}>{labels.colDistribution}</th>
          </tr>
        </thead>
        <tbody>
          {pageRows.map((row, idx) => {
            const rank = start + idx + 1;
            const widthPct = Math.round((row.count / top) * 100);
            const opacity = Math.max(0.38, 1 - (rank - 1) * 0.04);
            const flag = FLAG_BY_CODE[row.country.code.toLowerCase()] ?? "";
            return (
              <tr key={row.country.id}>
                <td className="num text-aws-text3">{rank}</td>
                <td>
                  {flag && <span className="me-1.5">{flag}</span>}
                  <span className="text-aws-text2 font-semibold">
                    {row.country.nameAr}
                  </span>
                </td>
                <td className="num font-semibold">
                  {row.count.toLocaleString("en-US")}
                </td>
                <td className="num">{row.share.toFixed(1)}%</td>
                <td>
                  <div className="bg-aws-bg h-1.5 w-full overflow-hidden rounded-sm">
                    <div
                      className="h-full"
                      style={{
                        width: `${widthPct}%`,
                        background: "#024E28",
                        opacity,
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="border-aws-border2 flex items-center justify-between border-t px-4 py-2.5">
        <div className="text-aws-text3 num text-[12px]">
          {t("paginationRange", {
            from: start + 1,
            to: end,
            total: rows.length,
          })}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            aria-label={t("paginationPrevious")}
            title={t("paginationPrevious")}
            className="border-aws-border2 text-aws-text2 hover:border-brand-green hover:text-brand-green hover:bg-brand-green/5 inline-flex h-7 w-7 items-center justify-center rounded-xs border bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PrevIcon className="h-3.5 w-3.5" />
          </button>
          <span className="text-aws-text2 num min-w-[72px] text-center text-[12px]">
            {t("paginationLabel", { page: safePage, total: totalPages })}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            aria-label={t("paginationNext")}
            title={t("paginationNext")}
            className="border-aws-border2 text-aws-text2 hover:border-brand-green hover:text-brand-green hover:bg-brand-green/5 inline-flex h-7 w-7 items-center justify-center rounded-xs border bg-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            <NextIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
