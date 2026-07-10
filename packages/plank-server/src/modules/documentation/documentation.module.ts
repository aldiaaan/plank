import type { FastifyInstance } from "fastify";
import { ServerModule } from "../../server/module";

export class DocumentationModule extends ServerModule {
  name = "documentation";

  async register(app: FastifyInstance) {
    await app.register(import("@fastify/swagger"), {
      openapi: {
        info: {
          title: "API Reference",
          version: "1.0.0",
        },
      },
    });

    await app.register(import("@scalar/fastify-api-reference"), {
      routePrefix: "/reference",
    });
  }
}
