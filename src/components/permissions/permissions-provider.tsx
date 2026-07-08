"use client";

import { createContext, useContext, useMemo } from "react";

import {
  type Action,
  type PermissionMap,
  type Resource,
  can,
} from "@/lib/permissions";

interface PermissionsContextValue {
  permissions: PermissionMap;
  role: string;
  can: (resource: Resource, action: Action) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({
  permissions,
  role,
  children,
}: {
  permissions: PermissionMap;
  role: string;
  children: React.ReactNode;
}) {
  const value = useMemo<PermissionsContextValue>(
    () => ({
      permissions,
      role,
      can: (resource, action) => can(permissions, resource, action),
    }),
    [permissions, role],
  );
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/** Full permissions context. Safe no-op defaults when used outside a provider. */
export function usePermissions(): PermissionsContextValue {
  return (
    useContext(PermissionsContext) ?? {
      permissions: {},
      role: "",
      can: () => false,
    }
  );
}

/** Convenience hook for gating a single button/action. */
export function usePermission(resource: Resource, action: Action): boolean {
  return usePermissions().can(resource, action);
}
