import { deleteUserById } from "@plank/db/queries/users";
import { Type } from "typebox";
import { route } from "../../../server/module";
import { ErrorResponse } from "../../../server/errors";
import { SuccessResponse } from "../../../server/responses";
import { CannotDeleteSelfError, UserNotFoundError } from "../errors";

const DeletedUserItem = Type.Object({
  id: Type.String({ format: "uuid" }),
  email: Type.String({ format: "email" }),
  name: Type.String(),
});

export const DELETE = route({
  config: {
    allow: ["admin:delete:users", "write:all"],
  },
  schema: {
    tags: ["Users"],
    summary: "Delete user",
    description:
      "Deletes a user by id. Cascades to sessions, accounts, and role assignments. Returns 400 if you attempt to delete yourself, 404 if the user does not exist.",
    params: Type.Object({
      id: Type.String({
        format: "uuid",
        description: "User id to delete",
      }),
    }),
    response: {
      200: SuccessResponse(DeletedUserItem),
      400: ErrorResponse,
      404: ErrorResponse,
    },
  },
  handler: async (request, reply) => {
    const db = request.container.resolve("db");
    const { id } = request.params;

    if (request.locals.user?.id === id) {
      throw new CannotDeleteSelfError();
    }

    const deleted = await deleteUserById(db, id);
    if (!deleted) {
      throw new UserNotFoundError();
    }

    return reply.send({
      message: "ok",
      result: deleted,
    });
  },
});
