import { Type } from "typebox";
import { route } from "../../../server/module";
import { listUsers } from "@plank/db/queries/users";

const Querystring = Type.Object({
  name: Type.Optional(Type.String()),
});

const Response = Type.Object({
  message: Type.String(),
  hhh2: Type.Optional(Type.String()),
  users: Type.Array(
    Type.Object({
      id: Type.String(),
      name: Type.String(),
      email: Type.String(),
    }),
  ),
});

export const GET = route({
  schema: {
    querystring: Querystring,
    response: {
      200: Response,
    },
  },
  handler: async (request, reply) => {
    const db = request.container.resolve("db");
    const { items } = await listUsers(db, { limit: 1 });
    const name = request.query.name ?? "world";
    reply.send({ message: `pong ${name}`, users: items });
  },
});
