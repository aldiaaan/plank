export const PERMISSIONS = [
  "write:all",
  "read:all",
  "admin:create:users",
  "admin:read:users",
  "admin:update:users",
  "admin:delete:users",
  "admin:create:roles",
  "admin:read:roles",
  "admin:update:roles",
  "admin:delete:roles",
  "admin:create:permissions",
  "admin:read:permissions",
  "admin:update:permissions",
  "admin:delete:permissions",
  "admin:impersonate",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export function hasPermission(
  user: readonly Permission[],
  required: Permission,
): boolean {
  return user.includes(required) || user.includes("write:all");
}

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}
