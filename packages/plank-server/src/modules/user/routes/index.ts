import { Type } from "typebox";
import { listUsers } from "@plank/db/queries/users";
import type { Permission } from "@plank/db";
import { route } from "../../../server/module";
import { SuccessResponse } from "../../../server/responses";

const PermissionSchema = Type.Union([
  Type.Literal("write:all"),
  Type.Literal("read:all"),
]);

const UserItem = Type.Object({
  id: Type.String({ format: "uuid" }),
  email: Type.String({ format: "email" }),
  name: Type.String(),
  permissions: Type.Array(PermissionSchema),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

export const GET = route({
  schema: {
    querystring: Type.Object({
      search: Type.Optional(Type.String()),
      permissions: Type.Optional(Type.Array(PermissionSchema)),
      createdAtGte: Type.Optional(Type.String({ format: "date" })),
      createdAtLte: Type.Optional(Type.String({ format: "date" })),
      limit: Type.Optional(
        Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
      ),
      offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
    }),
    response: {
      200: SuccessResponse(
        Type.Object({
          items: Type.Array(UserItem),
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
      createdAtGte,
      createdAtLte,
      limit = 20,
      offset = 0,
    } = request.query;

    const result = await listUsers(db, {
      search,
      permissions: permissions as Permission[] | undefined,
      createdAtGte,
      createdAtLte,
      limit,
      offset,
    });

    return reply.send({
      message: "ok",
      result: {
        items: result.items.map((user) => ({
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        })),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  },
});
