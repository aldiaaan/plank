import { and, count, desc, eq, gt, gte, ilike, lte, or, type SQL } from "drizzle-orm";
import type { DatabaseOrTransaction } from "..";
import {
  roles,
  sessions,
  userRoles,
  users,
  type NewSession,
  type Permission,
} from "../schema";
import { buildOrderBy, type SortInput } from "./sort";

export type ListSessionsOptions = {
  search?: string;
  createdAtGte?: string;
  createdAtLte?: string;
  expiresAtGte?: string;
  expiresAtLte?: string;
  sorting?: SortInput[];
  limit?: number;
  offset?: number;
};

export type ListedSession = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const sessionSortColumns = {
  createdAt: sessions.createdAt,
  updatedAt: sessions.updatedAt,
  expiresAt: sessions.expiresAt,
  userName: users.name,
  userEmail: users.email,
} as const;

export async function listSessions(
  db: DatabaseOrTransaction,
  options: ListSessionsOptions = {},
): Promise<{
  items: ListedSession[];
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
      ilike(sessions.id, pattern),
    );
    if (searchFilter) filters.push(searchFilter);
  }

  if (options.createdAtGte) {
    filters.push(gte(sessions.createdAt, new Date(options.createdAtGte)));
  }

  if (options.createdAtLte) {
    const end = new Date(options.createdAtLte);
    end.setHours(23, 59, 59, 999);
    filters.push(lte(sessions.createdAt, end));
  }

  if (options.expiresAtGte) {
    filters.push(gte(sessions.expiresAt, new Date(options.expiresAtGte)));
  }

  if (options.expiresAtLte) {
    const end = new Date(options.expiresAtLte);
    end.setHours(23, 59, 59, 999);
    filters.push(lte(sessions.expiresAt, end));
  }

  const where = filters.length > 0 ? and(...filters) : undefined;
  const orderBy = buildOrderBy(options.sorting, sessionSortColumns, [
    desc(sessions.createdAt),
  ]);

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: sessions.id,
        userId: sessions.userId,
        userEmail: users.email,
        userName: users.name,
        expiresAt: sessions.expiresAt,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(where)
      .orderBy(...orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(where),
  ]);

  return {
    items: rows,
    total: totalRow?.total ?? 0,
    limit,
    offset,
  };
}

export async function createSession(
  db: DatabaseOrTransaction,
  values: Pick<NewSession, "id" | "userId" | "secretHash" | "expiresAt">,
) {
  const [session] = await db.insert(sessions).values(values).returning();
  return session;
}

export async function findValidSessionById(
  db: DatabaseOrTransaction,
  id: string,
) {
  const [row] = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return row;
}

export async function findPermissionsByUserId(
  db: DatabaseOrTransaction,
  userId: string,
): Promise<Permission[]> {
  const rows = await db
    .select({ permissions: roles.permissions })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(userRoles.userId, userId));

  return [...new Set(rows.flatMap((row) => row.permissions))];
}

export async function deleteSessionById(
  db: DatabaseOrTransaction,
  id: string,
) {
  await db.delete(sessions).where(eq(sessions.id, id));
}

export async function deleteSessionsByUserId(
  db: DatabaseOrTransaction,
  userId: string,
) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}
