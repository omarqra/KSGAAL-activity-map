import { z } from "zod";

export const idParam = z.object({ id: z.coerce.number().int().positive() });

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, { message: "PASSWORD_TOO_SHORT" })
  .max(PASSWORD_MAX, { message: "PASSWORD_TOO_LONG" })
  .regex(/[a-z]/, { message: "PASSWORD_MISSING_LOWERCASE" })
  .regex(/[A-Z]/, { message: "PASSWORD_MISSING_UPPERCASE" })
  .regex(/\d/, { message: "PASSWORD_MISSING_DIGIT" })
  .regex(/[^A-Za-z0-9]/, { message: "PASSWORD_MISSING_SYMBOL" });

export const COUNTRY_REGIONS = [
  "gulf",
  "levant",
  "north_africa",
  "africa",
  "asia",
  "europe",
  "americas",
  "other",
] as const;

export const ENTITY_STATUSES = ["active", "pending"] as const;

export const countryCreate = z.object({
  code: z.string().min(2).max(8),
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  short: z.string().min(1),
  capital: z.string().nullish(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  hasDetailedMap: z.boolean().optional(),
  region: z.enum(COUNTRY_REGIONS).optional(),
  status: z.enum(ENTITY_STATUSES).optional(),
});
export const countryUpdate = countryCreate.partial();

export const ORG_KINDS = [
  "international",
  "government",
  "university",
  "non_profit",
  "other",
] as const;

export const organizationCreate = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  short: z.string().min(1),
  kind: z.enum(ORG_KINDS),
  status: z.enum(ENTITY_STATUSES).optional(),
  city: z.string().nullish(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  countryId: z.number().int().positive().nullish(),
});
export const organizationUpdate = organizationCreate.partial();

export const activityTypeCreate = z.object({
  labelAr: z.string().min(1),
  labelEn: z.string().min(1),
  color: z.string().regex(/^#?[0-9a-fA-F]{3,8}$/),
});
export const activityTypeUpdate = activityTypeCreate.partial();

export const activitySubtypeCreate = z.object({
  parentTypeId: z.number().int().positive(),
  labelAr: z.string().min(1),
  labelEn: z.string().min(1),
});
export const activitySubtypeUpdate = activitySubtypeCreate.partial();

export const activityCreate = z
  .object({
    name: z.string().min(1),
    dateText: z.string().nullish(),
    dateParsed: z.coerce.date().nullish(),
    typeId: z.number().int().positive(),
    subtypeId: z.number().int().positive().nullish(),
    countryId: z.number().int().positive().nullish(),
    organizationId: z.number().int().positive().nullish(),
    lat: z.number().min(-90).max(90).nullish(),
    lng: z.number().min(-180).max(180).nullish(),
  })
  .refine((v) => v.countryId || v.organizationId, {
    message: "Activity must belong to a country or an organization",
    path: ["countryId"],
  });
export const activityUpdate = z.object({
  name: z.string().min(1).optional(),
  dateText: z.string().nullish(),
  dateParsed: z.coerce.date().nullish(),
  typeId: z.number().int().positive().optional(),
  subtypeId: z.number().int().positive().nullish(),
  countryId: z.number().int().positive().nullish(),
  organizationId: z.number().int().positive().nullish(),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
});

export const USER_ROLES = ["admin", "editor", "viewer"] as const;

export const userCreate = z.object({
  email: z.string().email().max(160),
  name: z.string().min(1).max(120).nullish(),
  password: passwordSchema,
  role: z.enum(USER_ROLES).default("admin"),
  isActive: z.boolean().optional(),
});
export const userUpdate = z
  .object({
    email: z.string().email().max(160).optional(),
    name: z.string().min(1).max(120).nullish(),
    password: passwordSchema.optional(),
    role: z.enum(USER_ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .partial();
