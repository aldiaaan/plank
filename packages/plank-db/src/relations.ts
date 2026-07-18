import { defineRelations } from "drizzle-orm";
import { accounts, roles, sessions, userRoles, users } from "./schema";

export const relations = defineRelations(
  { users, sessions, accounts, roles, userRoles },
  (r) => ({
    sessions: {
      user: r.one.users({
        from: r.sessions.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    accounts: {
      user: r.one.users({
        from: r.accounts.userId,
        to: r.users.id,
        optional: false,
      }),
    },
    userRoles: {
      user: r.one.users({
        from: r.userRoles.userId,
        to: r.users.id,
        optional: false,
      }),
      role: r.one.roles({
        from: r.userRoles.roleId,
        to: r.roles.id,
        optional: false,
      }),
    },
    users: {
      sessions: r.many.sessions(),
      accounts: r.many.accounts(),
      userRoles: r.many.userRoles(),
      roles: r.many.roles({
        from: r.users.id.through(r.userRoles.userId),
        to: r.roles.id.through(r.userRoles.roleId),
      }),
    },
    roles: {
      userRoles: r.many.userRoles(),
      users: r.many.users(),
    },
  }),
);
