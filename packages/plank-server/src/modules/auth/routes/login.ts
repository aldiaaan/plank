import { Type } from "typebox";
import { findBasicAccountByIdentifier } from "@plank/db/auth";
import { defineRoute } from "../../../server/module";
import { verifyPassword } from "../utils";

const Body = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 1 }),
});

const User = Type.Object({
  id: Type.String({ format: "uuid" }),
  email: Type.String({ format: "email" }),
  name: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});

const Response = Type.Object({
  user: User,
});

const Unauthorized = Type.Object({
  message: Type.String(),
});

export const POST = defineRoute({
  schema: {
    body: Body,
    response: {
      200: Response,
      401: Unauthorized,
    },
  },
  handler: async (request, reply) => {
    const db = request.container.resolve("db");
    const { email, password } = request.body;

    const account = await findBasicAccountByIdentifier(db, email);

    if (
      !account?.credential ||
      !(await verifyPassword(password, account.credential))
    ) {
      return reply.status(401).send({ message: "Invalid email or password" });
    }

    return reply.send({
      user: {
        ...account.user,
        createdAt: account.user.createdAt.toISOString(),
        updatedAt: account.user.updatedAt.toISOString(),
      },
    });
  },
});
