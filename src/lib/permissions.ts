/**
 * Shared RBAC primitives used by both the server (enforcement) and the client
 * (button gating + roles UI). No server-only imports here so it can be bundled
 * into client components.
 *
 * A permission map is `{ [resource]: { read, create, update, delete } }`.
 */

export const RESOURCES = [
  "activities",
  "countries",
  "organizations",
  "activityTypes",
  "users",
  "roles",
] as const;
export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ["read", "create", "update", "delete"] as const;
export type Action = (typeof ACTIONS)[number];

export type ResourcePermissions = Partial<Record<Action, boolean>>;
export type PermissionMap = Partial<Record<Resource, ResourcePermissions>>;

/** Every resource × action set to the given value. */
function fill(value: boolean): PermissionMap {
  const map: PermissionMap = {};
  for (const r of RESOURCES) {
    map[r] = {};
    for (const a of ACTIONS) map[r]![a] = value;
  }
  return map;
}

export function fullPermissions(): PermissionMap {
  return fill(true);
}

export function emptyPermissions(): PermissionMap {
  return fill(false);
}

/** Read-only across every resource. */
function readOnly(): PermissionMap {
  const map = emptyPermissions();
  for (const r of RESOURCES) map[r]!.read = true;
  return map;
}

/** Full access to the content resources, none for users/roles. */
function contentManager(): PermissionMap {
  const map = readOnly();
  for (const r of ["activities", "countries", "organizations", "activityTypes"] as const) {
    map[r] = { read: true, create: true, update: true, delete: true };
  }
  return map;
}

/**
 * Built-in role presets seeded on first run. `admin` is the system role that
 * always keeps every permission.
 */
export const ROLE_PRESETS: Record<
  string,
  { nameAr: string; nameEn: string; isSystem: boolean; permissions: PermissionMap }
> = {
  admin: {
    nameAr: "مسؤول",
    nameEn: "Admin",
    isSystem: true,
    permissions: fullPermissions(),
  },
  editor: {
    nameAr: "محرّر",
    nameEn: "Editor",
    isSystem: false,
    permissions: contentManager(),
  },
  viewer: {
    nameAr: "مشاهِد",
    nameEn: "Viewer",
    isSystem: false,
    permissions: readOnly(),
  },
};

/** Whether `perms` grants `action` on `resource`. */
export function can(
  perms: PermissionMap | null | undefined,
  resource: Resource,
  action: Action,
): boolean {
  return !!perms?.[resource]?.[action];
}

/** Normalize an unknown JSON value into a clean PermissionMap. */
export function normalizePermissions(input: unknown): PermissionMap {
  const out: PermissionMap = {};
  if (input && typeof input === "object") {
    const obj = input as Record<string, unknown>;
    for (const r of RESOURCES) {
      const cell = obj[r];
      if (cell && typeof cell === "object") {
        const c = cell as Record<string, unknown>;
        out[r] = {};
        for (const a of ACTIONS) out[r]![a] = c[a] === true;
      }
    }
  }
  return out;
}
