import { and, eq } from "drizzle-orm";

import type { Database, DatabaseOrTransaction } from "..";
import { accounts, roles, userRoles, users } from "../schema";

export const SUPER_ADMIN_ROLE_NAME = "super_admin";

export async function findBasicAccountByIdentifier(
  db: DatabaseOrTransaction,
  identifier: string,
) {
  const [row] = await db
    .select({
      user: users,
      credential: accounts.credential,
    })
    .from(accounts)
    .innerJoin(users, eq(accounts.userId, users.id))
    .where(
      and(
        eq(accounts.provider, "basic"),
        eq(accounts.identifier, identifier),
      ),
    )
    .limit(1);

  return row;
}

export async function hasUserWithRole(
  db: DatabaseOrTransaction,
  roleName: string,
): Promise<boolean> {
  const [row] = await db
    .select({ userId: userRoles.userId })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(eq(roles.name, roleName))
    .limit(1);

  return !!row;
}

export async function findRoleByName(
  db: DatabaseOrTransaction,
  roleName: string,
) {
  const [role] = await db
    .select()
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);

  return role;
}

export async function createSuperAdminRole(db: DatabaseOrTransaction) {
  const [role] = await db
    .insert(roles)
    .values({
      name: SUPER_ADMIN_ROLE_NAME,
      description: "Full access super administrator",
      isSystem: true,
      permissions: ["write:all", "read:all"],
    })
    .returning();

  return role;
}

export async function createUser(
  db: DatabaseOrTransaction,
  values: { email: string; name: string },
) {
  const [user] = await db.insert(users).values(values).returning();
  return user;
}

export async function createBasicAccount(
  db: DatabaseOrTransaction,
  values: {
    userId: string;
    identifier: string;
    credential: string;
  },
) {
  await db.insert(accounts).values({
    userId: values.userId,
    provider: "basic",
    identifier: values.identifier,
    credential: values.credential,
  });
}

export async function assignUserRole(
  db: DatabaseOrTransaction,
  values: { userId: string; roleId: string },
) {
  await db.insert(userRoles).values(values);
}

export async function initializeSuperAdmin(
  db: Database,
  values: {
    email: string;
    credential: string;
  },
): Promise<"skipped" | "created"> {
  return db.transaction(async (tx) => {
    if (await hasUserWithRole(tx, SUPER_ADMIN_ROLE_NAME)) {
      return "skipped";
    }

    const role =
      (await findRoleByName(tx, SUPER_ADMIN_ROLE_NAME)) ??
      (await createSuperAdminRole(tx));

    const user = await createUser(tx, {
      email: values.email,
      name: "Super Admin",
    });

    await createBasicAccount(tx, {
      userId: user.id,
      identifier: values.email,
      credential: values.credential,
    });

    await assignUserRole(tx, {
      userId: user.id,
      roleId: role.id,
    });

    return "created";
  });
}
