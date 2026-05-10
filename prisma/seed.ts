import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { guessOrgKind, regionForCode } from "./seed-mappings";
import { seedAdminUser } from "./seed-user";

const prisma = new PrismaClient();

type RawActivity = {
  name: string;
  type: string;
  subtype: string | null;
  date: string | null;
};

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

const ARABIC_MONTHS: Record<string, number> = {
  يناير: 1,
  فبراير: 2,
  مارس: 3,
  أبريل: 4,
  ابريل: 4,
  مايو: 5,
  يونيو: 6,
  يوليو: 7,
  أغسطس: 8,
  اغسطس: 8,
  سبتمبر: 9,
  أكتوبر: 10,
  اكتوبر: 10,
  نوفمبر: 11,
  ديسمبر: 12,
};

function parseArabicDate(text: string | null): Date | null {
  if (!text) return null;
  const yearMatch = text.match(/\b(20\d{2}|19\d{2})\b/);
  if (!yearMatch) return null;
  const year = Number(yearMatch[1]);

  let month = 1;
  for (const [ar, num] of Object.entries(ARABIC_MONTHS)) {
    if (text.includes(ar)) {
      month = num;
      break;
    }
  }

  // try to find first day in range like "6-7 أكتوبر" or "29 فبراير"
  let day = 1;
  const dayMatch = text.match(/\b(\d{1,2})(?:\s*[-–]\s*\d{1,2})?\s+[؀-ۿ]/);
  if (dayMatch) {
    const d = Number(dayMatch[1]);
    if (d >= 1 && d <= 31) day = d;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

async function main() {

  return null;

  const jsonPath = resolve(process.cwd(), "html/public/data/activities.json");
  const raw = JSON.parse(readFileSync(jsonPath, "utf-8")) as RawData;

  console.log("→ clearing existing data");
  await prisma.activity.deleteMany();
  await prisma.activitySubtype.deleteMany();
  await prisma.activityType.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.country.deleteMany();

  console.log("→ seeding activity types");
  const typeIdByKey = new Map<string, number>();
  for (const [key, value] of Object.entries(raw.activityTypes)) {
    const created = await prisma.activityType.create({
      data: {
        key,
        labelAr: value.label,
        labelEn: TYPE_EN_LABEL[key] ?? value.label,
        color: value.color,
      },
    });
    typeIdByKey.set(key, created.id);
  }

  console.log("→ seeding countries");
  const countryIdByCode = new Map<string, number>();
  const countryIdByArName = new Map<string, number>();
  for (const c of raw.countries) {
    const created = await prisma.country.create({
      data: {
        code: c.code,
        nameAr: c.name,
        nameEn: c.en,
        short: c.short,
        capital: c.capital ?? null,
        lat: c.lat,
        lng: c.lng,
        hasDetailedMap: c.hasDetailedMap ?? false,
        region: regionForCode(c.code),
        status: c.activities.length > 0 ? "active" : "pending",
      },
    });
    countryIdByCode.set(c.code, created.id);
    countryIdByArName.set(c.name, created.id);
    countryIdByArName.set(c.short, created.id);
  }

  console.log("→ seeding subtypes");
  const subtypeIdByKey = new Map<string, number>();
  const seenSubtype = new Set<string>();
  const collectSubtypes = (acts: RawActivity[]) => {
    for (const a of acts) {
      if (!a.subtype) continue;
      const parentId = typeIdByKey.get(a.type);
      if (!parentId) continue;
      const key = `${parentId}__${a.subtype}`;
      if (seenSubtype.has(key)) continue;
      seenSubtype.add(key);
    }
  };
  for (const c of raw.countries) collectSubtypes(c.activities);
  for (const o of raw.organizations ?? []) collectSubtypes(o.activities);

  for (const key of seenSubtype) {
    const [parentIdStr, labelAr] = key.split("__");
    const parentId = Number(parentIdStr);
    const created = await prisma.activitySubtype.create({
      data: {
        parentTypeId: parentId,
        labelAr,
        labelEn: SUBTYPE_EN_LABEL[labelAr] ?? labelAr,
      },
    });
    subtypeIdByKey.set(`${parentId}__${labelAr}`, created.id);
  }

  console.log("→ seeding organizations");
  const orgIdByCode = new Map<string, number>();
  for (const o of raw.organizations ?? []) {
          //@ts-expect-error type
    const countryId = o.country ? countryIdByArName.get(o.country as any) : undefined;
    const created = await prisma.organization.create({
      data: {
        code: o.code,
        nameAr: o.name,
        nameEn: o.en,
        short: o.short,
        kind: guessOrgKind(o.code, o.name),
        status: o.activities.length > 0 ? "active" : "pending",
        city: o.city ?? null,
        lat: o.lat,
        lng: o.lng,
        countryId: countryId ?? null,
      },
    });
    orgIdByCode.set(o.code, created.id);
  }

  console.log("→ seeding activities");
  const activityRows: Array<{
    name: string;
    dateText: string | null;
    dateParsed: Date | null;
    typeId: number;
    subtypeId: number | null;
    countryId: number | null;
    organizationId: number | null;
  }> = [];

  for (const c of raw.countries) {
    const countryId = countryIdByCode.get(c.code);
    if (!countryId) continue;
    for (const a of c.activities) {
      const typeId = typeIdByKey.get(a.type);
      if (!typeId) continue;
      const subtypeId = a.subtype
        ? (subtypeIdByKey.get(`${typeId}__${a.subtype}`) ?? null)
        : null;
      activityRows.push({
        name: a.name,
        dateText: a.date,
        dateParsed: parseArabicDate(a.date),
        //@ts-expect-error type
        typeId,
        subtypeId,
              //@ts-expect-error type
        countryId,
        organizationId: null,
      });
    }
  }

  for (const o of raw.organizations ?? []) {
    const orgId = orgIdByCode.get(o.code);
    if (!orgId) continue;
    for (const a of o.activities) {
      const typeId = typeIdByKey.get(a.type);
      if (!typeId) continue;
      const subtypeId = a.subtype
        ? (subtypeIdByKey.get(`${typeId}__${a.subtype}`) ?? null)
        : null;
      activityRows.push({
        name: a.name,
        dateText: a.date,
        dateParsed: parseArabicDate(a.date),
              //@ts-expect-error type
        typeId,
        subtypeId,
        countryId: null,
              //@ts-expect-error type
        organizationId: orgId,
      });
    }
  }

  await prisma.activity.createMany({ data: activityRows });

  console.log(`✓ done. inserted ${activityRows.length} activities`);

  console.log("→ seeding admin user");
  await seedAdminUser(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
