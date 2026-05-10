import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/dashboard/page-header";

import { DashboardPageActions } from "./dashboard-page-actions";

export async function DashboardPageHeader() {
  const t = await getTranslations("OverviewPage");

  return (
    <PageHeader
      meta={t("headerMeta")}
      title={t("headerTitle")}
      description={t("headerDescription")}
      actions={<DashboardPageActions />}
    />
  );
}
