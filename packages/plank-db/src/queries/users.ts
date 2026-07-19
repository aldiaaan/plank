import { and, count, desc, ilike, or, type SQL } from "drizzle-orm";
import type { DatabaseOrTransaction } from "..";
import { users } from "../schema";

export type ListUsersOptions = {
  search?: string;
  limit?: number;
  offset?: number;
};

export async function listUsers(
  db: DatabaseOrTransaction,
  options: ListUsersOptions = {},
) {
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

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [items, [totalRow]] = await Promise.all([
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
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ]);

  return {
    items,
    total: totalRow?.total ?? 0,
    limit,
    offset,
  };
}
