import { env } from "@/env/client";
import { serverFetch } from "@/lib/server-fetch";

export interface ActivityTypeSubtype {
  id: number;
  parentTypeId: number;
  labelAr: string;
  labelEn: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityType {
  id: number;
  key: string;
  labelAr: string;
  labelEn: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  subtypes: ActivityTypeSubtype[];
  _count: { activities: number };
}

export interface ActivitySubtypeParent {
  id: number;
  key: string;
  labelAr: string;
  labelEn: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivitySubtype {
  id: number;
  parentTypeId: number;
  labelAr: string;
  labelEn: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Parent type metadata is included by the API route via Prisma's
   * `include: { parentType: true }`. Optional in case the route changes.
   */
  parentType?: ActivitySubtypeParent;
  /**
   * Per-subtype activity count via Prisma's
   * `include: { _count: { select: { activities: true } } }`.
   */
  _count?: { activities: number };
}

export interface ActivityTypesSummary {
  mainTypes: number;
  subtypes: number;
  totalClassified: number;
  avgSubtypesPerType: number;
  lastUpdate: string | null;
}

interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string; details?: unknown } | null;
}

async function fetchEnvelope<T>(path: string): Promise<T> {
  const url = `${env.NEXT_PUBLIC_FRONTEND_URL}${path}`;
  const res = await serverFetch(url);
  const json = (await res.json()) as ApiEnvelope<T>;
  if (json.error || json.data == null) {
    throw new Error(json.error?.message ?? `Request to ${path} failed`);
  }
  return json.data;
}

export async function fetchActivityTypes(): Promise<ActivityType[]> {
  const data = await fetchEnvelope<{ items: ActivityType[] }>(
    "/api/admin/activity-types"
  );
  return data.items ?? [];
}

export async function fetchActivityTypesSummary(): Promise<ActivityTypesSummary> {
  return fetchEnvelope<ActivityTypesSummary>(
    "/api/admin/activity-types/summary"
  );
}

export async function fetchActivitySubtypes(
  parentTypeId?: number
): Promise<ActivitySubtype[]> {
  const suffix =
    parentTypeId !== undefined ? `?parentTypeId=${parentTypeId}` : "";
  const data = await fetchEnvelope<{ items: ActivitySubtype[] }>(
    `/api/admin/activity-subtypes${suffix}`
  );
  return data.items ?? [];
}
