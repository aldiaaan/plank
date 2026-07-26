import { and, count, desc, eq, gte, ilike, inArray, lte, or, type SQL, sql } from "drizzle-orm";

import type { Database, DatabaseOrTransaction } from "..";
import {
  type Permission,
  roles,
  userRoles,
  users,
} from "../schema";
import {
  assignUserRole,
  createBasicAccount,
  createUser,
} from "./auth";
import { findRoleById } from "./roles";
import { buildOrderBy, type SortInput } from "./sort";

export type ListUsersOptions = {
  search?: string;
  permissions?: Permission[];
  createdAtGte?: string;
  createdAtLte?: string;
  sorting?: SortInput[];
  limit?: number;
  offset?: number;
};

export type ListedUser = {
  id: string;
  email: string;
  name: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserAccountInput = {
  email: string;
  name: string;
  passwordHash: string;
  roleId: string;
};

const userSortColumns = {
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
  name: users.name,
  email: users.email,
} as const;

export async function createUserAccount(
  db: Database,
  input: CreateUserAccountInput,
): Promise<ListedUser | "role_not_found"> {
  const role = await findRoleById(db, input.roleId);
  if (!role) return "role_not_found";

  return db.transaction(async (tx) => {
    const user = await createUser(tx, {
      email: input.email,
      name: input.name,
    });

    await createBasicAccount(tx, {
      userId: user.id,
      identifier: input.email,
      credential: input.passwordHash,
    });

    await assignUserRole(tx, {
      userId: user.id,
      roleId: role.id,
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      permissions: role.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  });
}

export async function listUsers(
  db: DatabaseOrTransaction,
  options: ListUsersOptions = {},
): Promise<{
  items: ListedUser[];
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
      ilike(users.name, pattern),
      ilike(users.email, pattern),
    );
    if (searchFilter) filters.push(searchFilter);
  }

  if (options.createdAtGte) {
    filters.push(gte(users.createdAt, new Date(options.createdAtGte)));
  }

  if (options.createdAtLte) {
    const end = new Date(options.createdAtLte);
    end.setHours(23, 59, 59, 999);
    filters.push(lte(users.createdAt, end));
  }

  if (options.permissions?.length) {
    const permissionArray = sql`ARRAY[${sql.join(
      options.permissions.map((permission) => sql`${permission}`),
      sql`, `,
    )}]::permission[]`;

    filters.push(
      sql`exists (
        select 1
        from ${userRoles}
        inner join ${roles} on ${eq(userRoles.roleId, roles.id)}
        where ${eq(userRoles.userId, users.id)}
          and ${roles.permissions} && ${permissionArray}
      )`,
    );
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const orderBy = buildOrderBy(options.sorting, userSortColumns, [
    desc(users.createdAt),
  ]);

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ]);

  const userIds = rows.map((row) => row.id);
  const permissionsByUserId = new Map<string, Permission[]>();

  if (userIds.length > 0) {
    const permissionRows = await db
      .select({
        userId: userRoles.userId,
        permissions: roles.permissions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(userRoles.userId, userIds));

    for (const row of permissionRows) {
      const existing = permissionsByUserId.get(row.userId) ?? [];
      permissionsByUserId.set(row.userId, [
        ...new Set([...existing, ...row.permissions]),
      ]);
    }
  }

  return {
    items: rows.map((row) => ({
      ...row,
      permissions: permissionsByUserId.get(row.id) ?? [],
    })),
    total: totalRow?.total ?? 0,
    limit,
    offset,
  };
}

export async function findUserById(
  db: DatabaseOrTransaction,
  userId: string,
): Promise<{ id: string; email: string; name: string } | null> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export async function deleteUserById(
  db: DatabaseOrTransaction,
  userId: string,
): Promise<{ id: string; email: string; name: string } | null> {
  const [deleted] = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

  return deleted ?? null;
}
