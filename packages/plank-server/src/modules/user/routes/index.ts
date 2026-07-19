import { createUserAccount, listUsers } from "@plank/db/queries/users";
import type { Permission } from "@plank/db";
import { Type } from "typebox";
import { route } from "../../../server/module";
import { ErrorResponse } from "../../../server/errors";
import { SuccessResponse } from "../../../server/responses";
import { hashPassword } from "../../auth/utils";
import { EmailAlreadyTakenError, RoleNotFoundError } from "../errors";

const PermissionSchema = Type.Union([
  Type.Literal("write:all"),
  Type.Literal("read:all"),
]);

const SortInputSchema = Type.Object({
  id: Type.String(),
  desc: Type.Boolean(),
});

const UserItem = Type.Object({
  id: Type.String({ format: "uuid" }),
  email: Type.String({ format: "email" }),
  name: Type.String(),
  permissions: Type.Array(PermissionSchema),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  while (current && typeof current === "object") {
    if ("code" in current && (current as { code: unknown }).code === "23505") {
      return true;
    }
    current = "cause" in current ? (current as { cause: unknown }).cause : null;
  }
  return false;
}

export const GET = route({
  schema: {
    querystring: Type.Object({
      search: Type.Optional(Type.String()),
      permissions: Type.Optional(Type.Array(PermissionSchema)),
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
      sorting,
      limit = 20,
      offset = 0,
    } = request.query;

    const result = await listUsers(db, {
      search,
      permissions: permissions as Permission[] | undefined,
      createdAtGte,
      createdAtLte,
      sorting,
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

export const POST = route({
  schema: {
    body: Type.Object({
      name: Type.String({ minLength: 1 }),
      email: Type.String({ format: "email" }),
      password: Type.String({ minLength: 8 }),
      roleId: Type.String({ format: "uuid" }),
    }),
    response: {
      201: SuccessResponse(UserItem),
      400: ErrorResponse,
      409: ErrorResponse,
    },
  },
  handler: async (request, reply) => {
    const db = request.container.resolve("db");
    const { name, email, password, roleId } = request.body;

    try {
      const user = await createUserAccount(db, {
        name,
        email,
        roleId,
        passwordHash: await hashPassword(password),
      });

      if (user === "role_not_found") {
        throw new RoleNotFoundError();
      }

      return reply.status(201).send({
        message: "ok",
        result: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof RoleNotFoundError) throw error;
      if (isUniqueViolation(error)) {
        throw new EmailAlreadyTakenError();
      }
      throw error;
    }
  },
});
