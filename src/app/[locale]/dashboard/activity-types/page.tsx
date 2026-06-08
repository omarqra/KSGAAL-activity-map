import { Clock, Folder, FolderTree, Layers } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { requirePageAccess } from "@/lib/auth/require-page-access";

import type { Tab } from "@/components/dashboard/tabs";
import { Badge } from "@/components/ui/badge";

import { type KpiItem, ListPageShell } from "../_components/shared";
import { ActivityTypesActions } from "./_components/activity-types-actions";
import { ActivityTypesTabsBar } from "./_components/activity-types-tabs-bar";
import { MainTypesTable } from "./_components/main-types-table";
import { SubtypesTable } from "./_components/subtypes-table";
import {
  type ActivitySubtype,
  type ActivityType,
  type ActivityTypesSummary,
  fetchActivitySubtypes,
  fetchActivityTypes,
  fetchActivityTypesSummary,
} from "./_lib/api";

type LastUpdateDescKey =
  | "lastUpdateMinutes"
  | "lastUpdateHours"
  | "lastUpdateDays"
  | "lastUpdateNone";

interface LastUpdateMeta {
  value: number | string;
  descKey: LastUpdateDescKey;
}

function deriveLastUpdate(iso: string | null): LastUpdateMeta {
  if (!iso) return { value: "—", descKey: "lastUpdateNone" };
  const then = new Date(iso);
  if (Number.isNaN(then.getTime()))
    return { value: "—", descKey: "lastUpdateNone" };

  const diffMs = Date.now() - then.getTime();
  const diffMin = Math.max(0, Math.round(diffMs / 60_000));
  if (diffMin < 60) return { value: diffMin, descKey: "lastUpdateMinutes" };
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return { value: diffHr, descKey: "lastUpdateHours" };
  const diffDay = Math.round(diffHr / 24);
  return { value: diffDay, descKey: "lastUpdateDays" };
}

type ActivityTypesT = Awaited<ReturnType<typeof getTranslations>>;

function buildKpis(
  summary: ActivityTypesSummary,
  lastUpdate: LastUpdateMeta,
  t: ActivityTypesT
): KpiItem[] {
  return [
    {
      icon: Folder,
      iconColor: "#193D58",
      label: t("kpiMain"),
      value: summary.mainTypes,
      description: t("kpiMainDesc"),
    },
    {
      icon: FolderTree,
      iconColor: "#024E28",
      label: t("kpiSub"),
      value: summary.subtypes,
      description: t("kpiSubDesc", {
        avg: summary.avgSubtypesPerType.toFixed(1),
      }),
    },
    {
      icon: Layers,
      iconColor: "#D56028",
      label: t("kpiClassified"),
      value: summary.totalClassified.toLocaleString("en-US"),
      description: t("kpiClassifiedDesc"),
    },
    {
      icon: Clock,
      iconColor: "#459AA8",
      label: t("kpiLastUpdate"),
      value: lastUpdate.value,
      description: t(lastUpdate.descKey),
    },
  ];
}

function buildTabs(
  mainCount: number,
  subCount: number,
  t: ActivityTypesT
): Tab[] {
  return [
    {
      key: "main",
      label: (
        <>
          {t("tabMain")}{" "}
          <Badge variant="neutral" className="num">
            {mainCount}
          </Badge>
        </>
      ),
    },
    {
      key: "sub",
      label: (
        <>
          {t("tabSub")}{" "}
          <Badge variant="neutral" className="num">
            {subCount}
          </Badge>
        </>
      ),
    },
  ];
}

const EMPTY_SUMMARY: ActivityTypesSummary = {
  mainTypes: 0,
  subtypes: 0,
  totalClassified: 0,
  avgSubtypesPerType: 0,
  lastUpdate: null,
};

interface PageProps {
  searchParams?: Promise<{
    tab?: string;
    q?: string;
    parentTypeId?: string;
    page?: string;
  }>;
}

export default async function ActivityTypesPage({ searchParams }: PageProps) {
  const locale = await getLocale();
  await requirePageAccess(locale, "activityTypes", "read");
  const t = await getTranslations("ActivityTypesPage");
  const sp = (await searchParams) ?? {};
  const activeTab: "main" | "sub" = sp.tab === "sub" ? "sub" : "main";

  const [types, subtypes, summary] = await Promise.all([
    fetchActivityTypes().catch((): ActivityType[] => []),
    fetchActivitySubtypes().catch((): ActivitySubtype[] => []),
    fetchActivityTypesSummary().catch(() => EMPTY_SUMMARY),
  ]);

  const lastUpdate = deriveLastUpdate(summary.lastUpdate);
  const kpis = buildKpis(summary, lastUpdate, t);
  const tabs = buildTabs(summary.mainTypes, summary.subtypes, t);

  return (
    <ListPageShell
      meta={t("meta")}
      title={t("title")}
      description={t("description")}
      actions={<ActivityTypesActions mainTypes={types} />}
      kpis={kpis}
      tabsSlot={<ActivityTypesTabsBar tabs={tabs} />}
    >
      {activeTab === "main" ? (
        <MainTypesTable types={types} />
      ) : (
        <SubtypesTable subtypes={subtypes} mainTypes={types} />
      )}
    </ListPageShell>
  );
}
