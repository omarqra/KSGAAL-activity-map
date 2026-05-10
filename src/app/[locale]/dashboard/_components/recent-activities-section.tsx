import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";

import type { OverviewRecentActivity } from "../_lib/api";
import { RecentActivitiesTable } from "./recent-activities-table";

interface RecentActivitiesSectionProps {
  activities: OverviewRecentActivity[];
  totalActivities: number;
}

export async function RecentActivitiesSection({
  activities,
  totalActivities,
}: RecentActivitiesSectionProps) {
  const t = await getTranslations("OverviewPage");
  const items = activities.slice(0, 15);
  return (
    <RecentActivitiesTable
      title={
        <>
          {t("recentTitle")}{" "}
          <Badge variant="neutral" className="num">
            {t("recentCount", {
              shown: items.length,
              total: totalActivities,
            })}
          </Badge>
        </>
      }
      description={t("recentDescription")}
      items={items}
      searchPlaceholder={t("recentSearch")}
    />
  );
}
