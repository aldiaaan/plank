import { type Permission,PERMISSIONS } from "@plank/common";
import { type Static, type TLiteral, type TUnion,Type } from "typebox";

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

export const SortInputSchema = Type.Object({
  id: Type.String(),
  desc: Type.Boolean(),
});

export type SortInputSchema = Static<typeof SortInputSchema>;
