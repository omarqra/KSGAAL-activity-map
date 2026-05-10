import activitiesData from "@/data/activities.json";

export interface VisitorStat {
  countryId: string;
  countryCode: string;
  visits: number;
  trend: number[];
  delta: number;
}

interface RawCountry {
  code: string;
}

const data = activitiesData as { countries: RawCountry[] };

const SEEDED_VISITS: Record<string, { visits: number; delta: number }> = {
  sa: { visits: 18742, delta: 12.4 },
  ae: { visits: 14508, delta: 8.7 },
  eg: { visits: 9821, delta: -2.1 },
  ma: { visits: 7905, delta: 5.6 },
  fr: { visits: 6418, delta: 3.2 },
  us: { visits: 5972, delta: 1.4 },
  gb: { visits: 4811, delta: 7.9 },
  de: { visits: 3724, delta: -1.3 },
  tr: { visits: 3402, delta: 4.5 },
  id: { visits: 3105, delta: 9.1 },
  my: { visits: 2877, delta: 2.3 },
  in: { visits: 2510, delta: -0.8 },
  qa: { visits: 2244, delta: 6.2 },
  kw: { visits: 1987, delta: 3.8 },
  jp: { visits: 1742, delta: 1.1 },
};

const seedRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const buildTrend = (base: number, code: string) => {
  const seed = code.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = seedRandom(seed);
  const points: number[] = [];
  let cur = base * 0.78;
  for (let i = 0; i < 12; i++) {
    cur += (rand() - 0.4) * base * 0.05;
    points.push(Math.max(0, Math.round(cur)));
  }
  points.push(base);
  return points;
};

export const seedVisitorStats: VisitorStat[] = data.countries
  .map((c) => {
    const stat = SEEDED_VISITS[c.code];
    if (!stat) return null;
    return {
      countryId: `country_${c.code}`,
      countryCode: c.code,
      visits: stat.visits,
      delta: stat.delta,
      trend: buildTrend(stat.visits, c.code),
    };
  })
  .filter((s): s is VisitorStat => s !== null)
  .sort((a, b) => b.visits - a.visits);
