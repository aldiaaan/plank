import { listRoles } from "@plank/db/queries/roles";
import { Type } from "typebox";
import { route } from "../../../server/module";
import { SuccessResponse } from "../../../server/responses";

const PermissionSchema = Type.Union([
  Type.Literal("write:all"),
  Type.Literal("read:all"),
]);

const RoleItem = Type.Object({
  id: Type.String({ format: "uuid" }),
  name: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  isSystem: Type.Boolean(),
  permissions: Type.Array(PermissionSchema),
});

export const GET = route({
  schema: {
    response: {
      200: SuccessResponse(
        Type.Object({
          items: Type.Array(RoleItem),
        }),
      ),
    },
  },
  handler: async (request, reply) => {
    const db = request.container.resolve("db");
    const items = await listRoles(db);

    return reply.send({
      message: "ok",
      result: { items },
    });
  },
});
