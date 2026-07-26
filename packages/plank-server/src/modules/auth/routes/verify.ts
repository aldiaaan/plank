import { Type } from "typebox";
import { route } from "../../../server/module";
import { ErrorResponse } from "../../../server/errors";
import { SuccessResponse } from "../../../server/responses";
import { PermissionSchema } from "../../../server/schemas";

const ImpersonatorSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  email: Type.String({ format: "email" }),
  name: Type.String(),
});

export const POST = route({
  schema: {
    tags: ["Auth"],
    summary: "Verify session",
    description:
      "Validates session cookies and returns the effective authenticated user with permissions. When an impersonation cookie is present and valid, returns the impersonated user and the impersonator. Otherwise validates the session cookie. Returns 401 when no valid session exists.",
    body: Type.Object({
      cookie: Type.String({
        minLength: 1,
        description: "Raw session cookie value",
      }),
      impersonationCookie: Type.Optional(
        Type.String({
          minLength: 1,
          description:
            "Raw impersonation cookie value. When present and valid, takes precedence over the session cookie.",
        }),
      ),
    }),
    response: {
      200: SuccessResponse(
        Type.Object({
          id: Type.String({ format: "uuid" }),
          email: Type.String({ format: "email" }),
          name: Type.String(),
          permissions: Type.Array(PermissionSchema),
          impersonator: Type.Union([ImpersonatorSchema, Type.Null()]),
        }),
      ),
      401: ErrorResponse,
    },
  },
  handler: async (request, reply) => {
    const sessionService = request.container.resolve("sessionService");

    if (request.body.impersonationCookie) {
      try {
        const impersonation = await sessionService.verify(
          request.body.impersonationCookie,
        );
        if (impersonation.impersonator) {
          return reply.send({
            message: "ok",
            result: {
              id: impersonation.user.id,
              email: impersonation.user.email,
              name: impersonation.user.name,
              permissions: impersonation.permissions,
              impersonator: impersonation.impersonator,
            },
          });
        }
      } catch {
        // Invalid impersonation cookie — fall through to session.
      }
    }

    const result = await sessionService.verify(request.body.cookie);

    return reply.send({
      message: "ok",
      result: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        permissions: result.permissions,
        impersonator: null,
      },
    });
  },
});
