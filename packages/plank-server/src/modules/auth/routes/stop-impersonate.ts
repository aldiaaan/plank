import { Type } from "typebox";

import { ErrorResponse } from "@/server/errors";
import { route } from "@/server/module";
import { SuccessResponse } from "@/server/responses";
import {
  IMPERSONATION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/modules/session/constants";
import { NotImpersonatingError, UnauthorizedError } from "@/modules/auth/errors";

const AuthUserSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  email: Type.String({ format: "email" }),
  name: Type.String(),
});

export const POST = route({
  schema: {
    tags: ["Auth"],
    summary: "Stop impersonating",
    description:
      "Revokes the impersonation session and clears the impersonation cookie. The original session cookie is left intact so the admin is restored. Returns 400 when not currently impersonating.",
    response: {
      200: SuccessResponse(AuthUserSchema),
      400: ErrorResponse,
      401: ErrorResponse,
    },
  },
  handler: async (request, reply) => {
    const sessionService = request.container.resolve("sessionService");

    const impersonationToken = request.cookies[IMPERSONATION_COOKIE_NAME];
    if (!impersonationToken) {
      throw new NotImpersonatingError();
    }

    try {
      const impersonation = await sessionService.verify(impersonationToken);
      if (!impersonation.impersonator) {
        throw new NotImpersonatingError();
      }
    } catch (error) {
      if (error instanceof NotImpersonatingError) throw error;
      throw new NotImpersonatingError();
    }

    try {
      await sessionService.revoke(impersonationToken);
    } catch {
      // Session may already be invalid; still clear the cookie.
    }

    reply.clearCookie(IMPERSONATION_COOKIE_NAME, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    const sessionToken = request.cookies[SESSION_COOKIE_NAME];
    if (!sessionToken) {
      throw new UnauthorizedError();
    }

    try {
      const result = await sessionService.verify(sessionToken);
      return reply.send({
        message: "ok",
        result: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      });
    } catch {
      throw new UnauthorizedError();
    }
  },
});
