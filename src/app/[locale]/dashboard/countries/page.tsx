import {
  CheckCircle2,
  Compass,
  Flag,
  Map,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { requirePageAccess } from "@/lib/auth/require-page-access";

import type { Tab } from "@/components/dashboard/tabs";
import { Badge } from "@/components/ui/badge";

import { type KpiItem, ListPageShell } from "../_components/shared";
import { CountriesActions } from "./_components/countries-actions";
import { CountriesTable } from "./_components/countries-table";
import { CountriesTabsBar } from "./_components/countries-tabs-bar";
import {
  type CountriesSummary,
  fetchCountries,
  fetchCountriesSummary,
} from "./_lib/api";

const TAB_TO_REGION: Record<string, string | undefined> = {
  all: undefined,
  gulf: "gulf",
  levant: "levant",
  "north-africa": "north_africa",
  asia: "asia",
  europe: "europe",
  americas: "americas",
};

const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

interface CountriesPageProps {
  searchParams?: Promise<{
    tab?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    status?: string;
    region?: string;
  }>;
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function regionCount(summary: CountriesSummary, key: string): number {
  return summary.byRegion.find((r) => r.region === key)?.count ?? 0;
}

type CountriesT = Awaited<ReturnType<typeof getTranslations>>;

function buildKpis(summary: CountriesSummary, t: CountriesT): KpiItem[] {
  const activePct = pct(summary.active, summary.total);
  const detailedPct = pct(summary.withDetailedMap, summary.total);

  return [
    {
      icon: Flag,
      iconColor: "#024E28",
      label: t("kpiTotal"),
      value: summary.total,
    },
    {
      icon: CheckCircle2,
      iconColor: "#193D58",
      label: t("kpiActive"),
      value: summary.active,
      description: t("kpiActiveDesc", { pct: activePct }),
    },
    {
      icon: Map,
      iconColor: "#D56028",
      label: t("kpiDetailedMap"),
      value: summary.withDetailedMap,
      description: t("kpiDetailedMapDesc", { pct: detailedPct }),
    },
    {
      icon: Compass,
      iconColor: "#459AA8",
      label: t("kpiRegions"),
      value: summary.regionsCount,
      description: t("kpiRegionsDesc"),
    },
  ];
}

function buildTabs(summary: CountriesSummary, t: CountriesT): Tab[] {
  const tab = (key: string, labelKey: string, regionKey?: string): Tab => ({
    key,
    label: (
      <>
        {t(labelKey as any)}{" "}
        <Badge variant="neutral" className="num">
          {regionKey ? regionCount(summary, regionKey) : summary.total}
        </Badge>
      </>
    ),
  });
  return [
    tab("all", "tabAll"),
    tab("gulf", "tabGulf", "gulf"),
    tab("levant", "tabLevant", "levant"),
    tab("north-africa", "tabNorthAfrica", "north_africa"),
    tab("asia", "tabAsia", "asia"),
    tab("europe", "tabEurope", "europe"),
    tab("americas", "tabAmericas", "americas"),
  ];
}

const EMPTY_SUMMARY: CountriesSummary = {
  total: 0,
  active: 0,
  pending: 0,
  withDetailedMap: 0,
  regionsCount: 0,
  byRegion: [],
};

export default async function CountriesPage({
  searchParams,
}: CountriesPageProps) {
  const locale = await getLocale();
  await requirePageAccess(locale, "countries", "read");
  const t = await getTranslations("CountriesPage");
  const sp = (await searchParams) ?? {};
  const tabKey = sp.tab && sp.tab in TAB_TO_REGION ? sp.tab : "all";
  const tabRegion = TAB_TO_REGION[tabKey];
  const filterRegion = sp.region?.trim() || undefined;
  const region = filterRegion ?? tabRegion;
  const q = sp.q?.trim() || undefined;
  const status = sp.status?.trim() || undefined;
  const pageNum = (() => {
    const raw = Number(sp.page ?? "1");
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  })();
  const pageSize = (() => {
    const raw = Number(sp.pageSize ?? DEFAULT_PAGE_SIZE);
    return ALLOWED_PAGE_SIZES.includes(raw) ? raw : DEFAULT_PAGE_SIZE;
  })();

  const [summary, list] = await Promise.all([
    fetchCountriesSummary().catch(() => EMPTY_SUMMARY),
    fetchCountries({
      region,
      q,
      status,
      page: pageNum,
      pageSize,
    }).catch(() => ({
      items: [],
      total: 0,
      page: pageNum,
      pageSize,
    })),
  ]);

  const kpis = buildKpis(summary, t);
  const tabs = buildTabs(summary, t);

  return (
    <ListPageShell
      meta={t("meta")}
      title={t("title")}
      description={
        <>
          {t("descriptionLead")}{" "}
          <a href="#" className="btn-link">
            {t("descriptionLink")}
          </a>
        </>
      }
      actions={<CountriesActions />}
      kpis={kpis}
      tabsSlot={<CountriesTabsBar tabs={tabs} />}
    >
      <CountriesTable items={list.items} total={list.total} />
    </ListPageShell>
  );
}
