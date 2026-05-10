export const ORG_KIND_BY_CODE: Record<string, string> = {
  un: "international",
  un_ge: "international",
  oic: "international",
  unesco: "international",
  mwl: "non_profit",
  ical: "non_profit",
  arab_league: "international",
  gcc: "international",
  alecso: "international",
  icesco: "international",
  itu: "international",
  unwto: "international",
  fifa: "non_profit",
};

export const COUNTRY_REGION_BY_CODE: Record<string, string> = {
  sa: "gulf", ae: "gulf", qa: "gulf", kw: "gulf", om: "gulf", bh: "gulf",
  sy: "levant", lb: "levant", jo: "levant", ps: "levant",
  eg: "north_africa", ma: "north_africa", tn: "north_africa",
  dz: "north_africa", ly: "north_africa", sd: "north_africa",
  cn: "asia", in: "asia", kz: "asia", kr: "asia", kg: "asia", tm: "asia",
  sg: "asia", my: "asia", mv: "asia", tw: "asia", tr: "asia", tj: "asia",
  jp: "asia", id: "asia", uz: "asia", pk: "asia", af: "asia", bn: "asia",
  bd: "asia", th: "asia", az: "asia",
  fr: "europe", es: "europe", ba: "europe", de: "europe", gb: "europe",
  no: "europe", it: "europe", ro: "europe", xk: "europe", ru: "europe",
  at: "europe", by: "europe", pl: "europe", al: "europe",
  et: "africa", km: "africa", za: "africa", gn: "africa", ke: "africa",
  ng: "africa", ug: "africa",
  us: "americas", ca: "americas", br: "americas", mx: "americas",
  ar: "americas",
};

export const guessOrgKind = (code: string, name: string): string => {
  const override = ORG_KIND_BY_CODE[code];
  if (override) return override;
  const n = name.toLowerCase();
  if (/جامعة الدول|arab league/.test(n)) return "international";
  if (/جامعة|university|أكاديمية|أكاديم|academy/.test(n)) return "university";
  if (/سفارة|embassy|وزارة|ministry|مجلس التعاون|gcc/.test(n))
    return "government";
  if (/أمم متحدة|الأمم|united nations|يونسكو|unesco|الإيسيسكو|الإلكسو/.test(n))
    return "international";
  if (/منظمة|اتحاد|رابطة|league|union|federation|fifa|دار|نشر/.test(n))
    return "non_profit";
  return "other";
};

export const regionForCode = (code: string): string =>
  COUNTRY_REGION_BY_CODE[code] ?? "other";
