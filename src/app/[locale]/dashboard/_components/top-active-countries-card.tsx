import { getTranslations } from "next-intl/server";

import { BarChart } from "@/components/dashboard/bar-chart";
import { Card } from "@/components/ui/card";

interface BarItem {
  label: string;
  value: number;
  flag?: string;
}

interface TopActiveCountriesCardProps {
  data: BarItem[];
}

export async function TopActiveCountriesCard({
  data,
}: TopActiveCountriesCardProps) {
  const t = await getTranslations("OverviewPage");
  return (
    <Card
      className="lg:col-span-2"
      title={t("topActiveTitle")}
      description={t("topActiveDescription")}
    >
      <BarChart data={data} />
    </Card>
  );
}
