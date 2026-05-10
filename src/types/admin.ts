export type ID = number;

export interface Country {
  id: ID;
  code: string;
  nameAr: string;
  nameEn: string;
  short: string;
  capital?: string;
  lat: number;
  lng: number;
  hasDetailedMap?: boolean;
}

export interface ActivityType {
  id: ID;
  key: string;
  labelAr: string;
  labelEn: string;
  color: string;
}

export interface ActivitySubtype {
  id: ID;
  parentTypeId: ID;
  labelAr: string;
  labelEn: string;
}

export type OrganizationKind =
  | "university"
  | "ministry"
  | "embassy"
  | "academy"
  | "publisher"
  | "ngo"
  | "company"
  | "other";

export interface Organization {
  id: ID;
  nameAr: string;
  nameEn: string;
  kind: OrganizationKind;
  countryId?: ID;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Activity {
  id: ID;
  countryId: ID;
  typeId: ID;
  subtypeId?: ID;
  organizationId?: ID;
  name: string;
  date: string;
}

export const ORGANIZATION_KINDS: OrganizationKind[] = [
  "university",
  "ministry",
  "embassy",
  "academy",
  "publisher",
  "ngo",
  "company",
  "other",
];
