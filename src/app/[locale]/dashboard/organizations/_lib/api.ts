import { env } from "@/env/client";
import { serverFetch } from "@/lib/server-fetch";

export interface OrganizationCountryRef {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
}

export interface Organization {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  short: string;
  kind: string;
  status: string;
  city: string | null;
  lat: number;
  lng: number;
  countryId: number | null;
  country: OrganizationCountryRef | null;
  _count: { activities: number };
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationsListResponse {
  items: Organization[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrganizationsSummary {
  total: number;
  active: number;
  pending: number;
  coverageCountries: number;
  byKind: Array<{ kind: string; count: number }>;
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

export interface FetchOrganizationsParams {
  kind?: string;
  q?: string;
  status?: string;
  countryId?: number;
  page?: number;
  pageSize?: number;
}

export async function fetchOrganizations(
  params?: FetchOrganizationsParams
): Promise<OrganizationsListResponse> {
  const qs = new URLSearchParams();
  if (params?.kind) qs.set("kind", params.kind);
  if (params?.q) qs.set("q", params.q);
  if (params?.status) qs.set("status", params.status);
  if (params?.countryId !== undefined)
    qs.set("countryId", String(params.countryId));
  if (params?.page !== undefined) qs.set("page", String(params.page));
  if (params?.pageSize !== undefined)
    qs.set("pageSize", String(params.pageSize));

  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchEnvelope<OrganizationsListResponse>(
    `/api/admin/organizations${suffix}`
  );
}

export async function fetchOrganizationsSummary(): Promise<OrganizationsSummary> {
  return fetchEnvelope<OrganizationsSummary>(
    "/api/admin/organizations/summary"
  );
}
