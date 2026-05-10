const PERMS = {
  USER: {
    READ: "user:read",
    CREATE: "user:create",
    UPDATE: "user:update",
    DELETE: "user:delete",
  },
  USER_TYPE: {
    READ: "user-type:read",
    CREATE: "user-type:create",
    UPDATE: "user-type:update",
    DELETE: "user-type:delete",
  },
  NOTIFICATION_PREFERENCES: {
    READ: "notification-preferences:read",
    UPDATE: "notification-preferences:update",
  },
  MY_NOTIFICATION_PREFERENCES: {
    READ: "my-notification-preferences:read",
    UPDATE: "my-notification-preferences:update",
  },
};

type PermissionsObject = typeof PERMS;
// Extract all values from all permission objects into a union type
type PERMS = {
  [K in keyof PermissionsObject]: PermissionsObject[K][keyof PermissionsObject[K]];
}[keyof PermissionsObject];

export default PERMS;
export type { PermissionsObject, PERMS };
