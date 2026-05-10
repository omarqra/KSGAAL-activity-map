import { DashboardFooter } from "./_components/dashboard-footer";
import { DashboardPageHeader } from "./_components/dashboard-page-header";
import { RecentActivitiesSection } from "./_components/recent-activities-section";
import { ResourcesSummary } from "./_components/resources-summary";
import { SystemHealthBanner } from "./_components/system-health-banner";
import { TopActiveCountriesCard } from "./_components/top-active-countries-card";
import { TopVisitedCountriesCard } from "./_components/top-visited-countries-card";
import { TypeDistributionCard } from "./_components/type-distribution-card";
import {
  fetchHealth,
  fetchOverview,
  fetchTopCountries,
  type HealthResponse,
  type TopCountriesResponse,
} from "./_lib/api";

const FLAG_BY_CODE: Record<string, string> = {
  sa: "🇸🇦",
  ae: "🇦🇪",
  eg: "🇪🇬",
  ma: "🇲🇦",
  jo: "🇯🇴",
  kw: "🇰🇼",
  qa: "🇶🇦",
  tn: "🇹🇳",
  bh: "🇧🇭",
  om: "🇴🇲",
  ye: "🇾🇪",
  iq: "🇮🇶",
  sy: "🇸🇾",
  lb: "🇱🇧",
  ps: "🇵🇸",
  sd: "🇸🇩",
  ly: "🇱🇾",
  dz: "🇩🇿",
  mr: "🇲🇷",
  so: "🇸🇴",
  dj: "🇩🇯",
  km: "🇰🇲",
  tr: "🇹🇷",
};

export default async function OverviewPage() {
  const healthFallback: HealthResponse = {
    status: "down",
    latencyMs: 0,
    checkedAt: new Date().toISOString(),
  };

  const topCountriesFallback: TopCountriesResponse = {
    limit: 10,
    total: 0,
    distinctCount: 0,
    topCountry: null,
    items: [],
  };

  const [overview, health, topCountries] = await Promise.all([
    fetchOverview(),
    fetchHealth().catch(() => healthFallback),
    fetchTopCountries(100).catch(() => topCountriesFallback),
  ]);

  const segments = overview.activitiesByType
    .filter((g) => g.type !== undefined)
    .map((g) => ({
      label: g.type!.labelAr,
      value: g.count,
      color: g.type!.color,
    }));

  const barData = topCountries.items.slice(0, 8).map((row) => ({
    label: row.country.nameAr,
    value: row.count,
    flag: FLAG_BY_CODE[row.country.code.toLowerCase()],
  }));

  return (
    <>
      <DashboardPageHeader />
      <SystemHealthBanner
        status={health.status}
        latencyMs={health.latencyMs}
        checkedAt={health.checkedAt}
      />

      <div className="space-y-5 p-6">
        <ResourcesSummary counts={overview.counts} />

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <TypeDistributionCard
            segments={segments}
            total={overview.counts.activities}
          />
          <TopActiveCountriesCard data={barData} />
        </section>

        <TopVisitedCountriesCard data={topCountries} />
        <RecentActivitiesSection
          activities={overview.recentActivities}
          totalActivities={overview.counts.activities}
        />

        <DashboardFooter />
      </div>
    </>
  );
}
