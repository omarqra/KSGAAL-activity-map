import { Activity, Building2, Flag, Shapes } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { KpiCard } from "@/components/ui/kpi-card";

import type { OverviewCounts } from "../_lib/api";

interface ResourcesSummaryProps {
  counts: OverviewCounts;
}

export async function ResourcesSummary({ counts }: ResourcesSummaryProps) {
  const t = await getTranslations("OverviewPage");

  const kpis = [
    {
      icon: Flag,
      iconColor: "#024E28",
      label: t("kpiCountries"),
      value: counts.countries,
      description: t("kpiCountriesDesc"),
      sparklineColor: "#024E28",
    },
    {
      icon: Building2,
      iconColor: "#193D58",
      label: t("kpiOrganizations"),
      value: counts.organizations,
      description: t("kpiOrganizationsDesc"),
    },
    {
      icon: Activity,
      iconColor: "#D56028",
      label: t("kpiActivities"),
      value: counts.activities.toLocaleString("en-US"),
      description: t("kpiActivitiesDesc"),
    },
    {
      icon: Shapes,
      iconColor: "#57072D",
      label: t("kpiActivityTypes"),
      value: counts.activityTypes,
      description: t("kpiActivityTypesDesc", {
        sub: counts.activitySubtypes,
      }),
    },
  ];

  return (
    <section>
      <h2 className="mb-3 text-[16px] font-bold">{t("summaryTitle")}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>
    </section>
  );
}
