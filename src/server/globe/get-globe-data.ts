import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";

import type {
  GlobeActivity,
  GlobeData,
  GlobeEntity,
  GlobeStats,
} from "./types";

export const GLOBE_DATA_CACHE_TAG = "globe:data";

const REVALIDATE_SECONDS = 60;

type ActivityRow = {
  id: number;
  name: string;
  dateText: string | null;
  lat: number | null;
  lng: number | null;
  type: { key: string };
  subtype: { labelAr: string } | null;
};

type CountryRow = {
  code: string;
  nameAr: string;
  nameEn: string;
  short: string;
  capital: string | null;
  lat: number;
  lng: number;
  hasDetailedMap: boolean;
  activities: ActivityRow[];
};

type OrganizationRow = {
  code: string;
  nameAr: string;
  nameEn: string;
  short: string;
  lat: number;
  lng: number;
  activities: ActivityRow[];
};

type ActivityTypeRow = {
  key: string;
  labelAr: string;
  color: string;
};

const ACTIVITY_INCLUDE = {
  orderBy: [{ dateParsed: "desc" as const }, { id: "desc" as const }],
  select: {
    id: true,
    name: true,
    dateText: true,
    lat: true,
    lng: true,
    type: { select: { key: true } },
    subtype: { select: { labelAr: true } },
  },
};

const toGlobeActivity = (a: ActivityRow): GlobeActivity => ({
  name: a.name,
  type: a.type.key,
  subtype: a.subtype?.labelAr ?? null,
  date: a.dateText ?? "",
  lat: a.lat,
  lng: a.lng,
});

const toCountryEntity = (c: CountryRow): GlobeEntity => ({
  code: c.code,
  name: c.nameAr,
  short: c.short,
  en: c.nameEn,
  capital: c.capital ?? undefined,
  lat: c.lat,
  lng: c.lng,
  hasDetailedMap: c.hasDetailedMap,
  activities: c.activities.map(toGlobeActivity),
});

const toOrganizationEntity = (o: OrganizationRow): GlobeEntity => ({
  code: o.code,
  name: o.nameAr,
  short: o.short,
  en: o.nameEn,
  lat: o.lat,
  lng: o.lng,
  activities: o.activities.map(toGlobeActivity),
});

async function fetchGlobeData(): Promise<GlobeData> {
  const [countries, organizations, activityTypes] = await Promise.all([
    prisma.country.findMany({
      where: { status: "active" },
      orderBy: { nameAr: "asc" },
      select: {
        code: true,
        nameAr: true,
        nameEn: true,
        short: true,
        capital: true,
        lat: true,
        lng: true,
        hasDetailedMap: true,
        activities: ACTIVITY_INCLUDE,
      },
    }),
    prisma.organization.findMany({
      where: { status: "active" },
      orderBy: { nameAr: "asc" },
      select: {
        code: true,
        nameAr: true,
        nameEn: true,
        short: true,
        lat: true,
        lng: true,
        activities: ACTIVITY_INCLUDE,
      },
    }),
    prisma.activityType.findMany({
      orderBy: { id: "asc" },
      select: { key: true, labelAr: true, color: true },
    }),
  ]);

  /* Aggregate global totals once on the server: total activity count
     plus per-type counts in the activity-type table's order. The hero
     card on the public page renders these directly; pre-computing here
     avoids re-walking every entity list on the client. */
  const typeKeys = (activityTypes as ActivityTypeRow[]).map((t) => t.key);
  const byTypeCount: Record<string, number> = Object.fromEntries(
    typeKeys.map((k) => [k, 0]),
  );
  let totalActivities = 0;
  for (const c of countries as CountryRow[]) {
    for (const a of c.activities) {
      totalActivities += 1;
      byTypeCount[a.type.key] = (byTypeCount[a.type.key] ?? 0) + 1;
    }
  }
  for (const o of organizations as OrganizationRow[]) {
    for (const a of o.activities) {
      totalActivities += 1;
      byTypeCount[a.type.key] = (byTypeCount[a.type.key] ?? 0) + 1;
    }
  }
  const stats: GlobeStats = {
    totalActivities,
    byType: typeKeys.map((k) => ({ key: k, count: byTypeCount[k] ?? 0 })),
  };

  return {
    activityTypes: Object.fromEntries(
      (activityTypes as ActivityTypeRow[]).map((t) => [
        t.key,
        { color: t.color, label: t.labelAr },
      ]),
    ),
    countries: (countries as CountryRow[]).map(toCountryEntity),
    organizations: (organizations as OrganizationRow[]).map(
      toOrganizationEntity,
    ),
    stats,
  };
}

/**
 * Server-side, request-deduplicated, time-cached fetcher for the public globe
 * scene. Use `revalidateTag(GLOBE_DATA_CACHE_TAG)` from admin mutations to
 * invalidate after edits.
 */
export const getGlobeData = unstable_cache(fetchGlobeData, ["globe:data"], {
  tags: [GLOBE_DATA_CACHE_TAG],
  revalidate: REVALIDATE_SECONDS,
});
