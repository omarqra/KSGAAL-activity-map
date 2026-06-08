import { ShieldCheck } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { requirePageAccess } from "@/lib/auth/require-page-access";

import { type KpiItem, ListPageShell } from "../_components/shared";
import { RolesTable } from "./_components/roles-table";
import { type Role, fetchRoles } from "./_lib/api";

export default async function RolesPage() {
  const locale = await getLocale();
  await requirePageAccess(locale, "roles", "read");
  const t = await getTranslations("RolesPage");
  const roles = await fetchRoles().catch((): Role[] => []);

  const kpis: KpiItem[] = [
    {
      icon: ShieldCheck,
      iconColor: "#024E28",
      label: t("kpiTotal"),
      value: roles.length,
      description: t("kpiTotalDesc"),
    },
  ];

  return (
    <ListPageShell
      meta={t("meta")}
      title={t("title")}
      description={t("description")}
      kpis={kpis}
    >
      <RolesTable roles={roles} />
    </ListPageShell>
  );
}
