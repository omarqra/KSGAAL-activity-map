"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";

import { useResourceUrlState } from "../../_components/shared";
import type { ActivitiesSummary } from "../_lib/api";

interface ActivitiesUrlState extends Record<string, string | number> {
  tab: string;
  q: string;
  status: string;
  typeId: string;
  hostKind: string;
  page: number;
  pageSize: number;
}

const EMPTY_SUMMARY: ActivitiesSummary = {
  total: 0,
  thisYear: 0,
  upcoming: 0,
  countriesReached: 0,
  organizationsReached: 0,
  byType: [],
  topCountry: null,
};

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string } | null;
}

export function ActivitiesTabsBar() {
  const t = useTranslations("ActivitiesPage");
  const { state, setParams } = useResourceUrlState<ActivitiesUrlState>({
    defaults: {
      tab: "all",
      q: "",
      status: "",
      typeId: "",
      hostKind: "",
      page: 1,
      pageSize: 10,
    },
    numericKeys: ["page", "pageSize"],
  });
  const [summary, setSummary] = useState<ActivitiesSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/activities/summary", { cache: "no-store" })
      .then((res) => res.json() as Promise<ApiEnvelope<ActivitiesSummary>>)
      .then((json) => {
        if (cancelled) return;
        setSummary(json.data ?? EMPTY_SUMMARY);
      })
      .catch(() => {
        if (cancelled) return;
        setSummary(EMPTY_SUMMARY);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!summary) {
    return <TypeTabsSkeleton />;
  }

  const tabs = [
    {
      key: "all",
      label: t("tabAll"),
      count: summary.total,
    },
    ...summary.byType.map((typ) => ({
      key: String(typ.typeId),
      label: typ.labelAr,
      count: typ.count,
    })),
  ];

  return (
    <div className="border-aws-border2 border-b bg-white px-6">
      <div className="flex flex-wrap items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = state.tab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setParams({ tab: tab.key, page: 1 })}
              className={
                active
                  ? "tab active inline-flex items-center gap-2"
                  : "tab inline-flex items-center gap-2"
              }
            >
              <span>{tab.label}</span>
              <Badge variant={active ? "info" : "neutral"} className="num">
                {tab.count}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TypeTabsSkeleton() {
  const widths = [120, 110, 140, 100, 130];
  return (
    <div
      role="status"
      aria-label="جاري تحميل الأنواع"
      className="border-aws-border2 border-b bg-white px-6"
    >
      <div className="flex items-center gap-2 py-2">
        {widths.map((w, i) => (
          <div
            key={i}
            className="bg-brand-light/40 h-8 animate-pulse rounded-md"
            style={{
              width: w,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
