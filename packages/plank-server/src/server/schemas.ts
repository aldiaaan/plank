import { PERMISSIONS, type Permission } from "@plank/common";
import { Type, type Static, type TLiteral, type TUnion } from "typebox";

type PermissionLiteral = TLiteral<Permission>;

export const PermissionSchema: TUnion<
  [PermissionLiteral, PermissionLiteral, ...PermissionLiteral[]]
> = Type.Union(
  PERMISSIONS.map((permission) => Type.Literal(permission)) as [
    PermissionLiteral,
    PermissionLiteral,
    ...PermissionLiteral[],
  ],
);

export type PermissionSchema = Static<typeof PermissionSchema>;
