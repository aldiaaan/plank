import { and, eq, gt } from "drizzle-orm";
import type { DatabaseOrTransaction } from "..";
import {
  roles,
  sessions,
  userRoles,
  users,
  type NewSession,
  type Permission,
} from "../schema";

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
