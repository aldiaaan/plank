import { Type } from "typebox";
import { defineRoute } from "../../../server/module";

const Querystring = Type.Object({
  name: Type.Optional(Type.String()),
});

const Response = Type.Object({
  message: Type.String(),
  hhh2: Type.Optional(Type.String()),
});

export const GET = defineRoute({
  schema: {
    querystring: Querystring,
    response: {
      200: Response,
    },
  },
  handler: (request, reply) => {
    request.container.resolve("eventBus");

    const name = request.query.name ?? "world";
    reply.send({ message: `pong ${name}` });
  },
});
