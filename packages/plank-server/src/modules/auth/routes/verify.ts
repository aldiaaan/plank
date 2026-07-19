import { Type } from "typebox";
import { route } from "../../../server/module";
import { ErrorResponse } from "../../../server/errors";
import { SuccessResponse } from "../../../server/responses";

export const POST = route({
  schema: {
    body: Type.Object({
      cookie: Type.String({ minLength: 1 }),
    }),
    response: {
      200: SuccessResponse(
        Type.Object({
          id: Type.String({ format: "uuid" }),
          email: Type.String({ format: "email" }),
          name: Type.String(),
          permissions: Type.Array(
            Type.Union([Type.Literal("write:all"), Type.Literal("read:all")]),
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
