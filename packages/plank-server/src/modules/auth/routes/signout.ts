import { Type } from "typebox";

import { route } from "@/server/module";
import { SuccessResponse } from "@/server/responses";
import {
  IMPERSONATION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/modules/session/constants";

export const POST = route({
  schema: {
    tags: ["Auth"],
    summary: "Sign out",
    description:
      "Revokes the given session and optional impersonation session (if still valid) and clears both cookies. Always succeeds so the client can clear local auth state.",
    body: Type.Object({
      cookie: Type.String({
        minLength: 1,
        description: "Raw session cookie value to revoke",
      }),
      impersonationCookie: Type.Optional(
        Type.String({
          minLength: 1,
          description: "Raw impersonation cookie value to revoke",
        }),
      ),
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

    if (request.body.impersonationCookie) {
      try {
        await sessionService.revoke(request.body.impersonationCookie);
      } catch {
        // Impersonation session may already be invalid; still clear the cookie.
      }
    }

    const cookieOptions = {
      path: "/",
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };

    reply.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
    reply.clearCookie(IMPERSONATION_COOKIE_NAME, cookieOptions);

    return reply.send({
      message: "ok",
      result: null,
    });
  },
});
