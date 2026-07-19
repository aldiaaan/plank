import { asc, eq } from "drizzle-orm";
import type { DatabaseOrTransaction } from "..";
import { roles, type Permission } from "../schema";

export type ListedRole = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
};

export async function listRoles(
  db: DatabaseOrTransaction,
): Promise<ListedRole[]> {
  return db
    .select({
      id: roles.id,
      name: roles.name,
      description: roles.description,
      isSystem: roles.isSystem,
      permissions: roles.permissions,
    })
    .from(roles)
    .orderBy(asc(roles.name));
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
