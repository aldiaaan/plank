import { listRoles } from "@plank/db/queries/roles";
import type { Permission } from "@plank/db";
import { Type } from "typebox";
import { route } from "../../../server/module";
import { SuccessResponse } from "../../../server/responses";

const PermissionSchema = Type.Union([
  Type.Literal("write:all"),
  Type.Literal("read:all"),
]);

const SortInputSchema = Type.Object({
  id: Type.String(),
  desc: Type.Boolean(),
});

const RoleItem = Type.Object({
  id: Type.String({ format: "uuid" }),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  isSystem: Type.Boolean(),
  permissions: Type.Array(PermissionSchema),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

export const GET = route({
  schema: {
    tags: ["Roles"],
    summary: "List roles",
    description:
      "Paginated, filterable list of roles. Used by the manage-roles table and when assigning a role to a user.",
    querystring: Type.Object({
      search: Type.Optional(Type.String()),
      permissions: Type.Optional(Type.Array(PermissionSchema)),
      isSystem: Type.Optional(Type.Boolean()),
      createdAtGte: Type.Optional(Type.String({ format: "date" })),
      createdAtLte: Type.Optional(Type.String({ format: "date" })),
      sorting: Type.Optional(Type.Array(SortInputSchema)),
      limit: Type.Optional(
        Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
      ),
      offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
    }),
    response: {
      200: SuccessResponse(
        Type.Object({
          items: Type.Array(RoleItem),
          total: Type.Integer({ minimum: 0 }),
          limit: Type.Integer({ minimum: 1 }),
          offset: Type.Integer({ minimum: 0 }),
        }),
      ),
    },
  },
  handler: async (request, reply) => {
    const db = request.container.resolve("db");
    const {
      search,
      permissions,
      isSystem,
      createdAtGte,
      createdAtLte,
      sorting,
      limit = 20,
      offset = 0,
    } = request.query;

    const result = await listRoles(db, {
      search,
      permissions: permissions as Permission[] | undefined,
      isSystem,
      createdAtGte,
      createdAtLte,
      sorting,
      limit,
      offset,
    });

    return reply.send({
      message: "ok",
      result: {
        items: result.items.map((role) => ({
          ...role,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString(),
        })),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  },
});
