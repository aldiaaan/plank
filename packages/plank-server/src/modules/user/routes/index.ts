import type { Permission } from "@plank/common";
import { createUserAccount, listUsers } from "@plank/db/queries/users";
import { Type } from "typebox";

import { ErrorResponse } from "../../../server/errors";
import { route } from "../../../server/module";
import { SuccessResponse } from "../../../server/responses";
import { PermissionSchema, SortInputSchema } from "../../../server/schemas";
import { hashPassword } from "../../auth/utils";
import { EmailAlreadyTakenError, RoleNotFoundError } from "../errors";

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
  config: {
    allow: ["admin:read:users", "read:all"],
  },
  schema: {
    tags: ["Users"],
    summary: "List users",
    description:
      "Returns a paginated list of users. Supports search by name/email, permission filters, registration date range, and multi-column sorting.",
    querystring: Type.Object({
      search: Type.Optional(
        Type.String({
          description: "Case-insensitive match against name or email",
        }),
      ),
      permissions: Type.Optional(
        Type.Array(PermissionSchema, {
          description: "Only users that have all of these permissions",
        }),
      ),
      createdAtGte: Type.Optional(
        Type.String({
          format: "date",
          description: "Include users created on or after this date (UTC)",
        }),
      ),
      createdAtLte: Type.Optional(
        Type.String({
          format: "date",
          description: "Include users created on or before this date (UTC)",
        }),
      ),
      sorting: Type.Optional(
        Type.Array(SortInputSchema, {
          description: "Sort columns in priority order (id + desc)",
        }),
      ),
      limit: Type.Optional(
        Type.Integer({
          minimum: 1,
          maximum: 100,
          default: 20,
          description: "Page size",
        }),
      ),
      offset: Type.Optional(
        Type.Integer({
          minimum: 0,
          default: 0,
          description: "Number of rows to skip",
        }),
      ),
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
  config: {
    allow: ["admin:create:users", "write:all"],
  },
  schema: {
    tags: ["Users"],
    summary: "Create user",
    description:
      "Creates a user account with the given role and hashed password. Returns 409 if the email is already taken, 400 if the role does not exist.",
    body: Type.Object({
      name: Type.String({ minLength: 1, description: "Display name" }),
      email: Type.String({ format: "email" }),
      password: Type.String({
        minLength: 8,
        description: "Plaintext password (hashed before storage)",
      }),
      roleId: Type.String({
        format: "uuid",
        description: "Existing role id from GET /roles",
      }),
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
