import { getTranslations } from "next-intl/server";

export async function DashboardFooter() {
  const t = await getTranslations("OverviewPage");
  return (
    <footer className="text-aws-text3 flex items-center justify-between pt-2 pb-6 text-[11px]">
      <span>{t("footerCopyright")}</span>
      <span className="num">{t("footerBuild")}</span>
    </footer>
  );
}
