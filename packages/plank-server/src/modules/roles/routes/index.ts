import { createRole, listRoles } from "@plank/db/queries/roles";
import type { Permission } from "@plank/common";
import { Type } from "typebox";
import { route } from "../../../server/module";
import { ErrorResponse } from "../../../server/errors";
import { SuccessResponse } from "../../../server/responses";
import { PermissionSchema, SortInputSchema } from "../../../server/schemas";
import { RoleNameAlreadyTakenError } from "../errors";

const RoleItem = Type.Object({
  id: Type.String({ format: "uuid" }),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  isSystem: Type.Boolean(),
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

export const POST = route({
  schema: {
    tags: ["Roles"],
    summary: "Create role",
    description:
      "Creates a custom role with the given name, optional description, and permissions. Returns 409 if the role name is already taken.",
    body: Type.Object({
      name: Type.String({
        minLength: 1,
        description: "Unique role name (e.g. editor)",
      }),
      description: Type.Optional(
        Type.Union([Type.String(), Type.Null()], {
          description: "Optional human-readable description",
        }),
      ),
      permissions: Type.Array(PermissionSchema, {
        minItems: 1,
        description: "At least one permission to grant",
      }),
    }),
    response: {
      201: SuccessResponse(RoleItem),
      409: ErrorResponse,
    },
  },
  handler: async (request, reply) => {
    const db = request.container.resolve("db");
    const { name, description, permissions } = request.body;

    try {
      const role = await createRole(db, {
        name: name.trim(),
        description:
          typeof description === "string" ? description.trim() || null : null,
        permissions: permissions as Permission[],
      });

      return reply.status(201).send({
        message: "ok",
        result: {
          ...role,
          createdAt: role.createdAt.toISOString(),
          updatedAt: role.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new RoleNameAlreadyTakenError();
      }
      throw error;
    }
  },
});
