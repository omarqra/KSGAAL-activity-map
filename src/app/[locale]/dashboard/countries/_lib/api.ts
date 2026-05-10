import { env } from "@/env/client";
import { serverFetch } from "@/lib/server-fetch";

export interface CountryRow {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  short: string;
  capital: string | null;
  lat: number;
  lng: number;
  hasDetailedMap: boolean;
  region: string;
  status: string;
  _count: { activities: number; organizations: number };
  createdAt: string;
  updatedAt: string;
}

export interface CountriesListResponse {
  items: CountryRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CountriesSummary {
  total: number;
  active: number;
  pending: number;
  withDetailedMap: number;
  regionsCount: number;
  byRegion: Array<{ region: string; count: number }>;
}

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string; details?: unknown } | null;
}

function apiBase(): string {
  return env.NEXT_PUBLIC_FRONTEND_URL.replace(/\/+$/, "");
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || json.error || json.data === null) {
    const message = json.error?.message ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return json.data;
}

export interface FetchCountriesParams {
  region?: string;
  q?: string;
  status?: string;
  hasDetailedMap?: boolean;
  page?: number;
  pageSize?: number;
}

export async function fetchCountries(
  params: FetchCountriesParams = {}
): Promise<CountriesListResponse> {
  const sp = new URLSearchParams();
  if (params.region) sp.set("region", params.region);
  if (params.q) sp.set("q", params.q);
  if (params.status) sp.set("status", params.status);
  if (typeof params.hasDetailedMap === "boolean") {
    sp.set("hasDetailedMap", String(params.hasDetailedMap));
  }
  if (params.page) sp.set("page", String(params.page));
  if (params.pageSize) sp.set("pageSize", String(params.pageSize));

  const qs = sp.toString();
  const url = `${apiBase()}/api/admin/countries${qs ? `?${qs}` : ""}`;

  const res = await serverFetch(url);
  return unwrap<CountriesListResponse>(res);
}

export type Country = CountryRow;

export async function fetchCountriesSummary(): Promise<CountriesSummary> {
  const url = `${apiBase()}/api/admin/countries/summary`;
  const res = await serverFetch(url);
  return unwrap<CountriesSummary>(res);
}
