import {
  Building2,
  CheckCircle2,
  EyeOff,
  Globe2,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { type KpiItem, ListPageShell } from "../_components/shared";
import { OrganizationsActions } from "./_components/organizations-actions";
import { OrganizationsTable } from "./_components/organizations-table";
import {
  type OrganizationsSummary,
  fetchOrganizations,
  fetchOrganizationsSummary,
} from "./_lib/api";

interface PageProps {
  searchParams?: Promise<{
    page?: string;
    pageSize?: string;
    q?: string;
    status?: string;
    countryId?: string;
  }>;
}

const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

const DEFAULT_PAGE_SIZE = 10;

type OrganizationsT = Awaited<ReturnType<typeof getTranslations>>;

function buildKpis(
  summary: OrganizationsSummary,
  t: OrganizationsT
): KpiItem[] {
  const activePct =
    summary.total > 0
      ? Number(((summary.active / summary.total) * 100).toFixed(1))
      : 0;

  return [
    {
      icon: Building2,
      iconColor: "#193D58",
      label: t("kpiTotal"),
      value: summary.total,
    },
    {
      icon: CheckCircle2,
      iconColor: "#024E28",
      label: t("kpiActive"),
      value: summary.active,
      description: t("kpiActiveDesc", { pct: activePct }),
    },
    {
      icon: EyeOff,
      iconColor: "#474747",
      label: t("kpiPending"),
      value: summary.pending,
      description: t("kpiPendingDesc"),
    },
    {
      icon: Globe2,
      iconColor: "#459AA8",
      label: t("kpiCoverage"),
      value: summary.coverageCountries,
    },
  ];
}

const EMPTY_SUMMARY: OrganizationsSummary = {
  total: 0,
  active: 0,
  pending: 0,
  coverageCountries: 0,
  byKind: [],
};

export default async function OrganizationsPage({ searchParams }: PageProps) {
  const t = await getTranslations("OrganizationsPage");
  const sp = (await searchParams) ?? {};
  const q = sp.q?.trim() || undefined;
  const status = sp.status || undefined;
  const countryId = sp.countryId ? Number(sp.countryId) : undefined;
  const pageNum = (() => {
    const raw = Number(sp.page ?? "1");
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1;
  })();
  const pageSize = (() => {
    const raw = Number(sp.pageSize ?? DEFAULT_PAGE_SIZE);
    return ALLOWED_PAGE_SIZES.includes(raw) ? raw : DEFAULT_PAGE_SIZE;
  })();

  const [summary, list] = await Promise.all([
    fetchOrganizationsSummary().catch(() => EMPTY_SUMMARY),
    fetchOrganizations({
      q,
      status,
      countryId,
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
      actions={<OrganizationsActions />}
      kpis={kpis}
    >
      <OrganizationsTable items={list.items} total={list.total} />
    </ListPageShell>
  );
}
