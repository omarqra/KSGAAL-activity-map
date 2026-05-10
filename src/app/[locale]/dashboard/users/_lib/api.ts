import { env } from "@/env/client";
import { serverFetch } from "@/lib/server-fetch";

export interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  passwordChangedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsersListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UsersSummary {
  total: number;
  active: number;
  disabled: number;
  recentLogins: number;
  byRole: Array<{ role: string; count: number }>;
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

export async function fetchUsers(): Promise<UsersListResponse> {
  return fetchEnvelope<UsersListResponse>(`/api/admin/users`);
}

export async function fetchUsersSummary(): Promise<UsersSummary> {
  return fetchEnvelope<UsersSummary>("/api/admin/users/summary");
}
