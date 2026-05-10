import { env } from "@/env/client";
import { serverFetch } from "@/lib/server-fetch";

export interface ApiActivityType {
  id: number;
  key: string;
  labelAr: string;
  labelEn: string;
  color: string;
}

export interface ApiActivitySubtype {
  id: number;
  parentTypeId: number;
  labelAr: string;
  labelEn: string;
}

export interface ApiActivityCountry {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  short: string;
  capital: string | null;
  lat: number;
  lng: number;
}

export interface ApiActivityOrganizationCountry {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
}

export interface ApiActivityOrganization {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  short: string;
  city: string | null;
  lat: number;
  lng: number;
  country: ApiActivityOrganizationCountry | null;
}

export interface ApiActivity {
  id: number;
  name: string;
  dateText: string | null;
  dateParsed: string | null;
  typeId: number;
  subtypeId: number | null;
  countryId: number | null;
  organizationId: number | null;
  lat: number | null;
  lng: number | null;
  type: ApiActivityType;
  subtype: ApiActivitySubtype | null;
  country: ApiActivityCountry | null;
  organization: ApiActivityOrganization | null;
}

export interface ActivitiesListResponse {
  items: ApiActivity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ActivitiesSummary {
  total: number;
  thisYear: number;
  upcoming: number;
  countriesReached: number;
  organizationsReached: number;
  byType: Array<{
    typeId: number;
    key: string;
    labelAr: string;
    labelEn: string;
    color: string;
    count: number;
  }>;
  topCountry: {
    code: string;
    nameAr: string;
    nameEn: string;
    short: string;
    count: number;
  } | null;
}

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string; details?: unknown } | null;
}

async function fetchEnvelope<T>(path: string): Promise<T> {
  const url = `${env.NEXT_PUBLIC_FRONTEND_URL}${path}`;
  const res = await serverFetch(url);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (json.error || !json.data) {
    throw new Error(json.error?.message ?? `Request to ${path} failed`);
  }
  return json.data;
}

export interface FetchActivitiesParams {
  q?: string;
  typeId?: number;
  subtypeId?: number;
  countryId?: number;
  organizationId?: number;
  yearFrom?: number;
  yearTo?: number;
  page?: number;
  pageSize?: number;
}

export const ACTIVITY_REFERENCE_YEAR = 2026;

export type ActivityStatusFilter =
  | "upcoming"
  | "active"
  | "completed";

export function statusToYearRange(
  status: ActivityStatusFilter | undefined,
  ref = ACTIVITY_REFERENCE_YEAR
): { yearFrom?: number; yearTo?: number } {
  if (!status) return {};
  if (status === "upcoming") return { yearFrom: ref + 1 };
  if (status === "active") return { yearFrom: ref, yearTo: ref };
  return { yearTo: ref - 1 };
}

function buildQuery(params?: FetchActivitiesParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    qs.set(key, String(value));
  }
  const out = qs.toString();
  return out ? `?${out}` : "";
}

export async function fetchActivities(
  params?: FetchActivitiesParams
): Promise<ActivitiesListResponse> {
  return fetchEnvelope<ActivitiesListResponse>(
    `/api/admin/activities${buildQuery(params)}`
  );
}

/** Fetch every activity by paging through the list endpoint until exhausted. */
export async function fetchAllActivities(
  params?: Omit<FetchActivitiesParams, "page" | "pageSize">
): Promise<ApiActivity[]> {
  const PAGE_SIZE = 100;
  const all: ApiActivity[] = [];
  let page = 1;
  // Hard cap to avoid runaway loops if the API ever misreports `total`.
  const MAX_PAGES = 100;
  while (page <= MAX_PAGES) {
    const res = await fetchActivities({
      ...params,
      page,
      pageSize: PAGE_SIZE,
    });
    all.push(...res.items);
    if (all.length >= res.total || res.items.length < PAGE_SIZE) break;
    page += 1;
  }
  return all;
}

export async function fetchActivitiesSummary(): Promise<ActivitiesSummary> {
  return fetchEnvelope<ActivitiesSummary>("/api/admin/activities/summary");
}

/* Lightweight by-id fetchers used to open the cross-resource edit sheets
   (organization / country / activity-type / activity-subtype) directly from
   the activities table cells. The activities list embeds only a partial
   shape, so we hydrate the full entity before passing it to the sheet. */

export async function fetchOrganizationByIdRaw<T>(id: number): Promise<T> {
  return fetchEnvelope<T>(`/api/admin/organizations/${id}`);
}

export async function fetchCountryByIdRaw<T>(id: number): Promise<T> {
  return fetchEnvelope<T>(`/api/admin/countries/${id}`);
}

export async function fetchActivityTypeByIdRaw<T>(id: number): Promise<T> {
  return fetchEnvelope<T>(`/api/admin/activity-types/${id}`);
}

export async function fetchActivitySubtypeByIdRaw<T>(id: number): Promise<T> {
  return fetchEnvelope<T>(`/api/admin/activity-subtypes/${id}`);
}
