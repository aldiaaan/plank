import type { Permission } from "./permissions";

export type AuthIdentity = {
  id: string;
  email: string;
  name: string;
};

export type AuthenticatedUser = AuthIdentity & {
  permissions: Permission[];
  impersonator: AuthIdentity | null;
};
