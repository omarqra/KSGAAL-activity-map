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

// BRD feedback #3/#38: field-level validation rules.
export const ACTIVITY_IMAGES_MAX = 5;
export const ACTIVITY_DESC_MIN_WORDS = 50;
export const ACTIVITY_DESC_MAX_WORDS = 150;

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// Description is optional (legacy activities have none), but when a non-empty
// value is provided it must fall within the 50–150 word range (BRD #38).
const descriptionField = z
  .string()
  .refine(
    (s) => {
      const w = wordCount(s);
      return w >= ACTIVITY_DESC_MIN_WORDS && w <= ACTIVITY_DESC_MAX_WORDS;
    },
    { message: "DESCRIPTION_WORD_RANGE" },
  )
  .nullish();

const imagesField = z
  .array(z.string().min(1))
  .max(ACTIVITY_IMAGES_MAX, { message: "IMAGES_MAX" })
  .optional();

// Shared activity fields. `name` is the legacy title; titleAr/titleEn and
// startDate/endDate are the new BRD fields. To stay backward compatible with the
// existing form (which still sends `name`/`dateParsed`), the new fields are
// optional and mirrored in the route. A title (name OR titleAr) is still required.
const activityBase = {
  name: z.string().min(1).max(120).optional(),
  titleAr: z.string().min(3, { message: "TITLE_TOO_SHORT" }).max(120).nullish(),
  titleEn: z.string().min(3).max(120).nullish(),
  dateText: z.string().nullish(),
  dateParsed: z.coerce.date().nullish(),
  startDate: z.coerce.date().nullish(),
  endDate: z.coerce.date().nullish(),
  description: descriptionField,
  images: imagesField,
  typeId: z.number().int().positive(),
  subtypeId: z.number().int().positive().nullish(),
  countryId: z.number().int().positive().nullish(),
  organizationId: z.number().int().positive().nullish(),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
};

// endDate must not precede startDate (BRD #22).
const endAfterStart = (v: { startDate?: Date | null; endDate?: Date | null }) =>
  !v.startDate || !v.endDate || v.endDate >= v.startDate;

export const activityCreate = z
  .object(activityBase)
  .refine((v) => v.name || v.titleAr, {
    message: "TITLE_REQUIRED",
    path: ["titleAr"],
  })
  .refine((v) => v.countryId || v.organizationId, {
    message: "Activity must belong to a country or an organization",
    path: ["countryId"],
  })
  .refine(endAfterStart, { message: "END_BEFORE_START", path: ["endDate"] });

export const activityUpdate = z
  .object({
    ...activityBase,
    typeId: z.number().int().positive().optional(),
  })
  .partial()
  .refine(endAfterStart, { message: "END_BEFORE_START", path: ["endDate"] });

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
