import {
  and,
  asc,
  count,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import type { DatabaseOrTransaction } from "..";
import { roles, type Permission } from "../schema";
import { buildOrderBy, type SortInput } from "./sort";

export type ListRolesOptions = {
  search?: string;
  permissions?: Permission[];
  isSystem?: boolean;
  createdAtGte?: string;
  createdAtLte?: string;
  sorting?: SortInput[];
  limit?: number;
  offset?: number;
};

export type ListedRole = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
};

const roleSortColumns = {
  name: roles.name,
  createdAt: roles.createdAt,
  updatedAt: roles.updatedAt,
} as const;

export async function listRoles(
  db: DatabaseOrTransaction,
  options: ListRolesOptions = {},
): Promise<{
  items: ListedRole[];
  total: number;
  limit: number;
  offset: number;
}> {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  const search = options.search?.trim();
  const filters: SQL[] = [];

  if (search) {
    const pattern = `%${search}%`;
    const searchFilter = or(
      ilike(roles.name, pattern),
      ilike(roles.description, pattern),
    );
    if (searchFilter) filters.push(searchFilter);
  }

  if (options.permissions?.length) {
    const permissionArray = sql`ARRAY[${sql.join(
      options.permissions.map((permission) => sql`${permission}`),
      sql`, `,
    )}]::permission[]`;

    filters.push(sql`${roles.permissions} && ${permissionArray}`);
  }

  if (typeof options.isSystem === "boolean") {
    filters.push(eq(roles.isSystem, options.isSystem));
  }

  if (options.createdAtGte) {
    filters.push(gte(roles.createdAt, new Date(options.createdAtGte)));
  }

  if (options.createdAtLte) {
    const end = new Date(options.createdAtLte);
    end.setHours(23, 59, 59, 999);
    filters.push(lte(roles.createdAt, end));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const orderBy = buildOrderBy(options.sorting, roleSortColumns, [
    asc(roles.name),
  ]);

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem,
        permissions: roles.permissions,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(roles)
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(roles).where(where),
  ]);

  return {
    items: rows,
    total: totalRow?.total ?? 0,
    limit,
    offset,
  };
}

export async function findRoleById(
  db: DatabaseOrTransaction,
  roleId: string,
) {
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  return role;
}

export async function createRole(
  db: DatabaseOrTransaction,
  values: {
    name: string;
    description?: string | null;
    permissions: Permission[];
  },
) {
  const [role] = await db
    .insert(roles)
    .values({
      name: values.name,
      description: values.description ?? null,
      permissions: values.permissions,
      isSystem: false,
    })
    .returning();

  if (!role) {
    throw new Error("Failed to create role");
  }

  return role;
}
