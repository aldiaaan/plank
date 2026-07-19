import { listSessions } from "@plank/db/queries/sessions";
import { Type } from "typebox";
import { route } from "../../../server/module";
import { SuccessResponse } from "../../../server/responses";

const SortInputSchema = Type.Object({
  id: Type.String(),
  desc: Type.Boolean(),
});

const SessionItem = Type.Object({
  id: Type.String(),
  userId: Type.String({ format: "uuid" }),
  userEmail: Type.String({ format: "email" }),
  userName: Type.String(),
  expiresAt: Type.String({ format: "date-time" }),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

export const GET = route({
  schema: {
    querystring: Type.Object({
      search: Type.Optional(Type.String()),
      createdAtGte: Type.Optional(Type.String({ format: "date" })),
      createdAtLte: Type.Optional(Type.String({ format: "date" })),
      expiresAtGte: Type.Optional(Type.String({ format: "date" })),
      expiresAtLte: Type.Optional(Type.String({ format: "date" })),
      sorting: Type.Optional(Type.Array(SortInputSchema)),
      limit: Type.Optional(
        Type.Integer({ minimum: 1, maximum: 100, default: 20 }),
      ),
      offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
    }),
    response: {
      200: SuccessResponse(
        Type.Object({
          items: Type.Array(SessionItem),
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
      createdAtGte,
      createdAtLte,
      expiresAtGte,
      expiresAtLte,
      sorting,
      limit = 20,
      offset = 0,
    } = request.query;

    const result = await listSessions(db, {
      search,
      createdAtGte,
      createdAtLte,
      expiresAtGte,
      expiresAtLte,
      sorting,
      limit,
      offset,
    });

    return reply.send({
      message: "ok",
      result: {
        items: result.items.map((session) => ({
          ...session,
          expiresAt: session.expiresAt.toISOString(),
          createdAt: session.createdAt.toISOString(),
          updatedAt: session.updatedAt.toISOString(),
        })),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  },
});
