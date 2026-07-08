import { env } from "@/env/client";
import { serverFetch } from "@/lib/server-fetch";
import type { PermissionMap } from "@/lib/permissions";

export interface Role {
  id: number;
  key: string;
  nameAr: string;
  nameEn: string;
  isSystem: boolean;
  permissions: PermissionMap;
  userCount: number;
  updatedAt: string;
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

export async function fetchRoles(): Promise<Role[]> {
  const data = await fetchEnvelope<{ items: Role[] }>("/api/admin/roles");
  return data.items;
}
