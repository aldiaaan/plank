import { Type } from "typebox";
import { findBasicAccountByIdentifier } from "@plank/db/auth";
import { route } from "../../../server/module";
import { ErrorResponse } from "../../../server/errors";
import { SuccessResponse } from "../../../server/responses";
import { SESSION_COOKIE_NAME, SESSION_TTL_MS } from "../../session/constants";
import { verifyPassword } from "../utils";
import { InvalidCredentialsError } from "../errors";

export const POST = route({
  schema: {
    tags: ["Auth"],
    summary: "Log in",
    description:
      "Authenticates with email and password, creates a session, and sets the httpOnly session cookie. Returns 401 when credentials are invalid.",
    body: Type.Object({
      email: Type.String({ format: "email" }),
      password: Type.String({ minLength: 1 }),
    }),
    response: {
      200: SuccessResponse(
        Type.Object({
          id: Type.String({ format: "uuid" }),
          email: Type.String({ format: "email" }),
          name: Type.String(),
          createdAt: Type.String({ format: "date-time" }),
          updatedAt: Type.String({ format: "date-time" }),
        }),
      ),
      401: ErrorResponse,
    },
  },
  handler: async (request, reply) => {
    const db = request.container.resolve("db");
    const sessionService = request.container.resolve("sessionService");
    const { email, password } = request.body;

    const account = await findBasicAccountByIdentifier(db, email);

    if (
      !account?.credential ||
      !(await verifyPassword(password, account.credential))
    ) {
      throw new InvalidCredentialsError();
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const { token } = await sessionService.create({
      userId: account.user.id,
      expiresAt,
    });

    reply.setCookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    return reply.send({
      message: "ok",
      result: {
        ...account.user,
        createdAt: account.user.createdAt.toISOString(),
        updatedAt: account.user.updatedAt.toISOString(),
      },
    });
  },
});
