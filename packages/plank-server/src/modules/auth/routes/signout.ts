import { Type } from "typebox";
import { route } from "../../../server/module";
import { SuccessResponse } from "../../../server/responses";
import { SESSION_COOKIE_NAME } from "../../session/constants";

export const POST = route({
  schema: {
    tags: ["Auth"],
    summary: "Sign out",
    description:
      "Revokes the given session (if still valid) and clears the session cookie. Always succeeds so the client can clear local auth state.",
    body: Type.Object({
      cookie: Type.String({
        minLength: 1,
        description: "Raw session cookie value to revoke",
      }),
    }),
    response: {
      200: SuccessResponse(Type.Null()),
    },
  },
  handler: async (request, reply) => {
    const sessionService = request.container.resolve("sessionService");

    try {
      await sessionService.revoke(request.body.cookie);
    } catch {
      // Session may already be invalid or expired; still clear the cookie.
    }

    reply.clearCookie(SESSION_COOKIE_NAME, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return reply.send({
      message: "ok",
      result: null,
    });
  },
});
