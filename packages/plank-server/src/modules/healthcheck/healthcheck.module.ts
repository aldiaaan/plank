import { FastifyInstance } from "fastify";
import { ServerModule } from "@/server/module";

export class HealthcheckModule extends ServerModule {
  name = "healthcheck";
  async register(app: FastifyInstance) {
    app.get("/healthcheck", (_request, reply) => {
      reply.send("pong");
    });
  }
}
