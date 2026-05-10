import { getTranslations } from "next-intl/server";

import { HealthBanner } from "@/components/dashboard/health-banner";

interface SystemHealthBannerProps {
  status: "ok" | "down";
  latencyMs: number;
  checkedAt: string;
}

type AgoKey =
  | "agoMoments"
  | "agoSeconds"
  | "agoMinutes"
  | "agoHours"
  | "agoDays";

function humanizeKey(iso: string): { key: AgoKey; n?: number } {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return { key: "agoMoments" };
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return { key: "agoSeconds" };
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return { key: "agoMinutes", n: diffMin };
  const diffHr = Math.floor(diffMin / 60);
  return { key: "agoHours", n: diffHr };
}

export async function SystemHealthBanner({
  status,
  latencyMs,
  checkedAt,
}: SystemHealthBannerProps) {
  const t = await getTranslations("OverviewPage");
  const isOk = status === "ok";
  const ago = humanizeKey(checkedAt);
  let agoText: string;
  if (ago.key === "agoMinutes" && ago.n !== undefined) {
    agoText = t("agoMinutes", { n: ago.n });
  } else if (ago.key === "agoHours" && ago.n !== undefined) {
    agoText = t("agoHours", { n: ago.n });
  } else if (ago.key === "agoSeconds") {
    agoText = t("agoSeconds");
  } else {
    agoText = t("agoMoments");
  }
  return (
    <div className="mx-6 mb-4">
      <HealthBanner
        status={isOk ? "success" : "error"}
        title={isOk ? t("healthTitleOk") : t("healthTitleDown")}
        detail={`${t("healthLastCheckPrefix")} ${agoText} · ${t("healthLatencyPrefix")} ${latencyMs}ms`}
        link={{ href: "#", label: t("healthLink") }}
      />
    </div>
  );
}
