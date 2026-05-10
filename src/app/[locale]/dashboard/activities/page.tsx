import { Activity, CalendarRange, Globe2, TrendingUp } from "lucide-react";
import { getTranslations } from "next-intl/server";



import Link from "next/link";



import { type KpiItem, ListPageShell } from "../_components/shared";
import { ActivitiesActions } from "./_components/activities-actions";
import { ActivitiesTable } from "./_components/activities-table";
import { ActivitiesTabsBar } from "./_components/activities-tabs-bar";
import { ACTIVITY_REFERENCE_YEAR, type ActivitiesSummary, type ActivityStatusFilter, fetchActivities, fetchActivitiesSummary, statusToYearRange } from "./_lib/api";
















interface PageProps {
  searchParams?: Promise<{
    tab?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    status?: string;
    typeId?: string;
    hostKind?: string;
  }>;
}

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

const DEFAULT_PAGE_SIZE = 10;

const EMPTY_SUMMARY: ActivitiesSummary = {
  total: 0,
  thisYear: 0,
  upcoming: 0,
  countriesReached: 0,
  organizationsReached: 0,
  byType: [],
  topCountry: null,
};

type T = Awaited<ReturnType<typeof getTranslations>>;

function buildKpis(summary: ActivitiesSummary, t: T): KpiItem[] {
  const topType = summary.byType[0];
  const completed = Math.max(
    0,
    summary.total - summary.thisYear - summary.upcoming
  );
  return [
    {
      icon: Activity,
      iconColor: "#024E28",
      label: t("kpiTotal"),
      value: summary.total.toLocaleString("en-US"),
      description: t("kpiTotalDesc", {
        countries: summary.countriesReached,
        orgs: summary.organizationsReached,
      }),
    },
    {
      icon: TrendingUp,
      iconColor: "#D56028",
      label: t("kpiThisYear", { year: ACTIVITY_REFERENCE_YEAR }),
      value: summary.thisYear.toLocaleString("en-US"),
      description: t("kpiThisYearDesc", { count: summary.upcoming }),
    },
    {
      icon: CalendarRange,
      iconColor: "#193D58",
      label: t("kpiTopType"),
      value: topType ? topType.count.toLocaleString("en-US") : "0",
      description: topType ? topType.labelAr : t("kpiTopTypeNone"),
    },
    {
      icon: Globe2,
      iconColor: "#459AA8",
      label: t("kpiCompleted"),
      value: completed.toLocaleString("en-US"),
      description: t("kpiCompletedDesc"),
    },
  ];
}

export default async function ActivitiesPage({ searchParams }: PageProps) {
  const t = await getTranslations("ActivitiesPage");
  const sp = (await searchParams) ?? {};
  const tabKey = sp.tab ?? "all";
  const tabTypeId =
    tabKey !== "all" && /^\d+$/.test(tabKey) ? Number(tabKey) : undefined;
  const filterStatus = (sp.status || undefined) as
    | ActivityStatusFilter
    | undefined;
  const yearRange = statusToYearRange(filterStatus);
  const q = sp.q?.trim() || undefined;
  const typeId = tabTypeId ?? (sp.typeId ? Number(sp.typeId) : undefined);
  const hostKind = sp.hostKind || undefined;
  const pageNum = (() => {
    const raw = Number(sp.page ?? "1");
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  })();
  const pageSize = (() => {
    const raw = Number(sp.pageSize ?? DEFAULT_PAGE_SIZE);
    return ALLOWED_PAGE_SIZES.includes(raw) ? raw : DEFAULT_PAGE_SIZE;
  })();

  const summaryPromise = fetchActivitiesSummary().catch(() => EMPTY_SUMMARY);

  const list = hostKind
    ? await (async () => {
        const all = await fetchActivities({
          q,
          typeId,
          ...yearRange,
          page: 1,
          pageSize: 10000,
        }).catch(() => ({
          items: [],
          total: 0,
          page: 1,
          pageSize: 10000,
        }));
        const matched = all.items.filter((it) =>
          hostKind === "country"
            ? it.country != null
            : hostKind === "organization"
              ? it.organization != null
              : true
        );
        const start = (pageNum - 1) * pageSize;
        return {
          items: matched.slice(start, start + pageSize),
          total: matched.length,
          page: pageNum,
          pageSize,
        };
      })()
    : await fetchActivities({
        q,
        typeId,
        ...yearRange,
        page: pageNum,
        pageSize,
      }).catch(() => ({
        items: [],
        total: 0,
        page: pageNum,
        pageSize,
      }));

  const summary = await summaryPromise;

  const kpis = buildKpis(summary, t);

  return (
    <ListPageShell
      meta={t("meta", { count: summary.total.toLocaleString("en-US") })}
      title={t("title")}
      description={
        <>
          {t("descriptionLead")} 
          <Link
            href={{ pathname: "/dashboard/activity-types", query: { tab: "main" } }}
            className="btn-link"
          >
            {t("descriptionLink")}
          </Link>
        </>
      }
      actions={<ActivitiesActions />}
      kpis={kpis}
      tabsSlot={<ActivitiesTabsBar />}
    >
      <ActivitiesTable items={list.items} total={list.total} />
    </ListPageShell>
  );
}


