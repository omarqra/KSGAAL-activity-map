import { getTranslations } from "next-intl/server";

import { DonutChart } from "@/components/dashboard/donut-chart";
import { Card } from "@/components/ui/card";

interface TypeSegment {
  label: string;
  value: number;
  color: string;
}

interface TypeDistributionCardProps {
  segments: TypeSegment[];
  total: number;
}

export async function TypeDistributionCard({
  segments,
  total,
}: TypeDistributionCardProps) {
  const t = await getTranslations("OverviewPage");
  return (
    <Card
      className="lg:col-span-1"
      title={t("distributionTitle")}
      action={
        <a href="#" className="btn-link text-[12px]">
          {t("distributionAction")}
        </a>
      }
    >
      <DonutChart
        centerLabel={total.toLocaleString("en-US")}
        centerSubLabel={t("distributionTotalLabel")}
        segments={segments}
      />
    </Card>
  );
}
