import { FastifyInstance } from "fastify";

export abstract class ServerModule {
  abstract name: string;
  abstract register(app: FastifyInstance): Promise<void>;
}
