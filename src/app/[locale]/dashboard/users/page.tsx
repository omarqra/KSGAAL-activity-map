import { Activity, ShieldCheck, UserCheck, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { type KpiItem, ListPageShell } from "../_components/shared";
import { UsersActions } from "./_components/users-actions";
import { UsersTable } from "./_components/users-table";
import {
  type UsersSummary,
  fetchUsers,
  fetchUsersSummary,
} from "./_lib/api";

const EMPTY_SUMMARY: UsersSummary = {
  total: 0,
  active: 0,
  disabled: 0,
  recentLogins: 0,
  byRole: [],
};

type UsersT = Awaited<ReturnType<typeof getTranslations>>;

function buildKpis(summary: UsersSummary, t: UsersT): KpiItem[] {
  const activePct =
    summary.total > 0
      ? Number(((summary.active / summary.total) * 100).toFixed(1))
      : 0;
  const adminsCount =
    summary.byRole.find((r) => r.role === "admin")?.count ?? 0;

  return [
    {
      icon: Users,
      iconColor: "#193D58",
      label: t("kpiTotal"),
      value: summary.total,
    },
    {
      icon: UserCheck,
      iconColor: "#024E28",
      label: t("kpiActive"),
      value: summary.active,
      description: t("kpiActiveDesc", { pct: activePct }),
    },
    {
      icon: ShieldCheck,
      iconColor: "#57072D",
      label: t("kpiAdmins"),
      value: adminsCount,
      description: t("kpiAdminsDesc"),
    },
    {
      icon: Activity,
      iconColor: "#459AA8",
      label: t("kpiRecentLogins"),
      value: summary.recentLogins,
      description: t("kpiRecentLoginsDesc"),
    },
  ];
}

export default async function UsersPage() {
  const t = await getTranslations("UsersPage");

  const [list, summary] = await Promise.all([
    fetchUsers().catch(() => ({
      items: [],
      total: 0,
      page: 1,
      pageSize: 0,
    })),
    fetchUsersSummary().catch(() => EMPTY_SUMMARY),
  ]);

  const kpis = buildKpis(summary, t);

  return (
    <ListPageShell
      meta={t("meta")}
      title={t("title")}
      description={t("description")}
      actions={<UsersActions />}
      kpis={kpis}
    >
      <UsersTable items={list.items} />
    </ListPageShell>
  );
}

