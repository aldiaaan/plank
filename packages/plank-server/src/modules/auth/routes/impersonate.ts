import { findUserById } from "@plank/db/queries/users";
import { hasPermission, type Permission } from "@plank/common";
import { Type } from "typebox";
import { route } from "../../../server/module";
import { ErrorResponse } from "../../../server/errors";
import { SuccessResponse } from "../../../server/responses";
import {
  IMPERSONATION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "../../session/constants";
import {
  AlreadyImpersonatingError,
  CannotImpersonateSelfError,
  ForbiddenError,
  ImpersonationUserNotFoundError,
  UnauthorizedError,
} from "../errors";

const ImpersonationUserSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  email: Type.String({ format: "email" }),
  name: Type.String(),
});

export const POST = route({
  schema: {
    tags: ["Auth"],
    summary: "Start impersonating a user",
    description:
      "Creates an impersonation session for the given user and sets the httpOnly impersonation cookie. The original session cookie is left unchanged. Requires admin:impersonate or write:all on the real session. Returns 400 if you attempt to impersonate yourself or are already impersonating, 404 if the target user does not exist.",
    body: Type.Object({
      userId: Type.String({
        format: "uuid",
        description: "User id to impersonate",
      }),
    }),
    response: {
      200: SuccessResponse(
        Type.Object({
          id: Type.String({ format: "uuid" }),
          email: Type.String({ format: "email" }),
          name: Type.String(),
          impersonator: ImpersonationUserSchema,
        }),
      ),
      400: ErrorResponse,
      401: ErrorResponse,
      403: ErrorResponse,
      404: ErrorResponse,
    },
  },
  handler: async (request, reply) => {
    const db = request.container.resolve("db");
    const sessionService = request.container.resolve("sessionService");

    const impersonationToken = request.cookies[IMPERSONATION_COOKIE_NAME];
    if (impersonationToken) {
      try {
        const existing = await sessionService.verify(impersonationToken);
        if (existing.impersonator) {
          throw new AlreadyImpersonatingError();
        }
      } catch (error) {
        if (error instanceof AlreadyImpersonatingError) throw error;
        // Stale impersonation cookie — continue.
      }
    }

    const sessionToken = request.cookies[SESSION_COOKIE_NAME];
    if (!sessionToken) {
      throw new UnauthorizedError();
    }

    let admin: {
      id: string;
      email: string;
      name: string;
      permissions: Permission[];
    };
    try {
      const result = await sessionService.verify(sessionToken);
      admin = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        permissions: result.permissions,
      };
    } catch {
      throw new UnauthorizedError();
    }

    const canImpersonate = hasPermission(
      admin.permissions,
      "admin:impersonate",
    );
    if (!canImpersonate) {
      throw new ForbiddenError();
    }

    const { userId } = request.body;
    if (userId === admin.id) {
      throw new CannotImpersonateSelfError();
    }

    const target = await findUserById(db, userId);
    if (!target) {
      throw new ImpersonationUserNotFoundError();
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const { token } = await sessionService.create({
      userId: target.id,
      impersonatorUserId: admin.id,
      expiresAt,
    });

    reply.setCookie(IMPERSONATION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });

    return reply.send({
      message: "ok",
      result: {
        id: target.id,
        email: target.email,
        name: target.name,
        impersonator: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
      },
    });
  },
});
