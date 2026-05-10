import { cookies } from "next/headers";

import { env } from "@/env/client";

import type { ApiActivity } from "../activities/_lib/api";

export interface OverviewCounts {
  countries: number;
  organizations: number;
  activities: number;
  activityTypes: number;
  activitySubtypes: number;
}

export interface ActivityTypeRef {
  id: number;
  key: string;
  labelAr: string;
  labelEn: string;
  color: string;
}

export interface OverviewActivityByType {
  type: ActivityTypeRef | undefined;
  count: number;
}

export interface CountryRef {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
}

export interface OverviewTopCountry {
  country: CountryRef | null | undefined;
  count: number;
}

export type OverviewRecentActivity = ApiActivity;

export interface OverviewResponse {
  counts: OverviewCounts;
  activitiesByType: OverviewActivityByType[];
  topCountries: OverviewTopCountry[];
  recentActivities: OverviewRecentActivity[];
}

export interface HealthResponse {
  status: "ok" | "down";
  database?: string;
  latencyMs: number;
  checkedAt: string;
}

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string; details?: unknown } | null;
}

async function fetchEnvelope<T>(path: string): Promise<T> {
  const url = `${env.NEXT_PUBLIC_FRONTEND_URL}${path}`;
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (json.error || !json.data) {
    throw new Error(json.error?.message ?? `Request to ${path} failed`);
  }
  return json.data;
}

export async function fetchOverview(): Promise<OverviewResponse> {
  return fetchEnvelope<OverviewResponse>("/api/admin/overview");
}

export async function fetchHealth(): Promise<HealthResponse> {
  return fetchEnvelope<HealthResponse>("/api/admin/health");
}

export interface TopCountryItem {
  country: CountryRef;
  count: number;
  share: number;
}

export interface TopCountriesResponse {
  limit: number;
  total: number;
  distinctCount: number;
  topCountry: (CountryRef & { count: number }) | null;
  items: TopCountryItem[];
}

export async function fetchTopCountries(
  limit = 10
): Promise<TopCountriesResponse> {
  return fetchEnvelope<TopCountriesResponse>(
    `/api/admin/top-countries?limit=${limit}`
  );
}

export interface SidebarCounts {
  countries: number;
  organizations: number;
  activities: number;
  activityTypes: number;
  activitySubtypes: number;
  users: number;
}

export async function fetchSidebarCounts(): Promise<SidebarCounts> {
  return fetchEnvelope<SidebarCounts>("/api/admin/sidebar-counts");
}
