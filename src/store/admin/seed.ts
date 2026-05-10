import activitiesData from "@/data/activities.json";
import {
  Activity,
  ActivitySubtype,
  ActivityType,
  Country,
  Organization,
  OrganizationKind,
} from "@/types/admin";

type RawCountry = {
  code: string;
  name: string;
  short: string;
  en: string;
  capital?: string;
  lat: number;
  lng: number;
  hasDetailedMap?: boolean;
  activities: RawActivity[];
};

type RawOrganization = {
  code: string;
  name: string;
  short: string;
  en: string;
  city?: string;
  country?: string;
  lat: number;
  lng: number;
  activities: RawActivity[];
};

type RawActivity = {
  name: string;
  type: string;
  subtype: string | null;
  date: string | null;
};

type RawData = {
  activityTypes: Record<string, { color: string; label: string }>;
  countries: RawCountry[];
  organizations?: RawOrganization[];
};

const TYPE_EN_LABEL: Record<string, string> = {
  الفعاليات: "Events",
  التعليم_والتدريب: "Education & Training",
  البحوث_العلمية_والكتب: "Research & Publications",
  الشراكات_والاتفاقيات: "Partnerships & Agreements",
  اللقاءات_الرسمية: "Official Meetings",
};

const SUBTYPE_EN_LABEL: Record<string, string> = {
  مؤتمر: "Conference",
  ندوة: "Symposium",
  ملتقى: "Forum",
  التدريب: "Training",
  التعليم: "Education",
  "بحث علمي": "Research",
  الاتفاقيات: "Agreement",
};

const guessOrgKind = (name: string): OrganizationKind => {
  const n = name.toLowerCase();
  if (/جامعة|university/.test(n)) return "university";
  if (/سفارة|embassy/.test(n)) return "embassy";
  if (/وزارة|ministry/.test(n)) return "ministry";
  if (/أكاديمية|أكاديم|academy/.test(n)) return "academy";
  if (/دار|نشر|publisher/.test(n)) return "publisher";
  if (/منظمة|اتحاد|رابطة|مجلس|league|union|council|organization/.test(n))
    return "ngo";
  if (/شركة|company|corporation|inc\./.test(n)) return "company";
  return "other";
};

const data = activitiesData as RawData;

let __nextId = 1;
const newId = () => __nextId++;

const typeIdByKey = new Map<string, number>();
const subtypeIdByCompound = new Map<string, number>();
const countryIdByCode = new Map<string, number>();
const orgIdByCode = new Map<string, number>();

export const seedActivityTypes: ActivityType[] = Object.entries(
  data.activityTypes
).map(([key, value]) => {
  const id = newId();
  typeIdByKey.set(key, id);
  return {
    id,
    key,
    labelAr: value.label,
    labelEn: TYPE_EN_LABEL[key] ?? key,
    color: value.color,
  };
});

const seedSubtypesArr: ActivitySubtype[] = [];
const collectSubtype = (typeKey: string, subtype: string) => {
  const parentTypeId = typeIdByKey.get(typeKey);
  if (!parentTypeId) return;
  const compoundKey = `${parentTypeId}::${subtype}`;
  if (subtypeIdByCompound.has(compoundKey)) return;
  const id = newId();
  subtypeIdByCompound.set(compoundKey, id);
  seedSubtypesArr.push({
    id,
    parentTypeId,
    labelAr: subtype,
    labelEn: SUBTYPE_EN_LABEL[subtype] ?? subtype,
  });
};
for (const country of data.countries) {
  for (const a of country.activities) {
    if (a.subtype) collectSubtype(a.type, a.subtype);
  }
}
for (const org of data.organizations ?? []) {
  for (const a of org.activities) {
    if (a.subtype) collectSubtype(a.type, a.subtype);
  }
}
export const seedSubtypes = seedSubtypesArr;

export const seedCountries: Country[] = data.countries.map((c) => {
  const id = newId();
  countryIdByCode.set(c.code, id);
  return {
    id,
    code: c.code,
    nameAr: c.name,
    nameEn: c.en,
    short: c.short,
    capital: c.capital,
    lat: c.lat,
    lng: c.lng,
    hasDetailedMap: c.hasDetailedMap,
  };
});

export const seedOrganizations: Organization[] = (
  data.organizations ?? []
).map((o) => {
  const matchedCountry = seedCountries.find((c) =>
    o.country
      ? c.nameAr.includes(o.country) ||
        c.short.includes(o.country) ||
        o.country.includes(c.short)
      : false
  );
  const id = newId();
  orgIdByCode.set(o.code, id);
  return {
    id,
    nameAr: o.name,
    nameEn: o.en,
    kind: guessOrgKind(`${o.name} ${o.en}`),
    countryId: matchedCountry?.id,
  };
});

const allActivities: Activity[] = [];
for (const c of data.countries) {
  const countryId = countryIdByCode.get(c.code);
  if (!countryId) continue;
  for (const a of c.activities) {
    const typeId = typeIdByKey.get(a.type);
    if (!typeId) continue;
    const subtypeId = a.subtype
      ? subtypeIdByCompound.get(`${typeId}::${a.subtype}`)
      : undefined;
    allActivities.push({
      id: newId(),
      countryId,
      typeId,
      subtypeId,
      name: a.name,
      date: a.date ?? "",
    });
  }
}
for (const o of data.organizations ?? []) {
  const orgId = orgIdByCode.get(o.code);
  if (!orgId) continue;
  for (const a of o.activities) {
    const typeId = typeIdByKey.get(a.type);
    if (!typeId) continue;
    const subtypeId = a.subtype
      ? subtypeIdByCompound.get(`${typeId}::${a.subtype}`)
      : undefined;
    const matchedCountry = seedCountries.find((c) =>
      o.country
        ? c.nameAr.includes(o.country) ||
          c.short.includes(o.country) ||
          o.country.includes(c.short)
        : false
    );
    allActivities.push({
      id: newId(),
      countryId: matchedCountry?.id ?? seedCountries[0].id,
      typeId,
      subtypeId,
      organizationId: orgId,
      name: a.name,
      date: a.date ?? "",
    });
  }
}
export const seedActivities = allActivities;
