import { Type } from "typebox";
import { route } from "../../../server/module";
import { ErrorResponse } from "../../../server/errors";
import { SuccessResponse } from "../../../server/responses";

export const POST = route({
  schema: {
    tags: ["Auth"],
    summary: "Verify session",
    description:
      "Validates a session cookie token and returns the authenticated user with permissions. Returns 401 when the session is missing, expired, or revoked.",
    body: Type.Object({
      cookie: Type.String({
        minLength: 1,
        description: "Raw session cookie value",
      }),
    }),
    response: {
      200: SuccessResponse(
        Type.Object({
          id: Type.String({ format: "uuid" }),
          email: Type.String({ format: "email" }),
          name: Type.String(),
          permissions: Type.Array(
            Type.Union([
              Type.Literal("write:all"),
              Type.Literal("read:all"),
              Type.Literal("admin:create:users"),
              Type.Literal("admin:read:users"),
              Type.Literal("admin:update:users"),
              Type.Literal("admin:delete:users"),
              Type.Literal("admin:create:roles"),
              Type.Literal("admin:read:roles"),
              Type.Literal("admin:update:roles"),
              Type.Literal("admin:delete:roles"),
              Type.Literal("admin:create:permissions"),
              Type.Literal("admin:read:permissions"),
              Type.Literal("admin:update:permissions"),
              Type.Literal("admin:delete:permissions"),
            ]),
          ),
        }),
      ),
      401: ErrorResponse,
    },
  },
  handler: async (request, reply) => {
    const sessionService = request.container.resolve("sessionService");
    const result = await sessionService.verify(request.body.cookie);

    return reply.send({
      message: "ok",
      result: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        permissions: result.permissions,
      },
    });
  },
});
