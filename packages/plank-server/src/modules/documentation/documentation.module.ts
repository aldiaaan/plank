import { ServerModule, type PlankFastifyInstance } from "../../server/module";

export type DocumentationModuleOptions = {
  baseUrl: string;
};

export class DocumentationModule extends ServerModule {
  name = "documentation";

  constructor(private readonly options?: DocumentationModuleOptions) {
    super();
  }

  async register(app: PlankFastifyInstance) {
    await app.register(import("@fastify/swagger"), {
      openapi: {
        servers: [{ url: this.options?.baseUrl ?? "http://localhost:3000" }],
        info: {
          title: "API Reference",
          version: "1.0.0",
        },
      },
    });

    app.get("/openapi.json", { schema: { hide: true } }, async () =>
      app.swagger(),
    );

    await app.register(import("@scalar/fastify-api-reference"), {
      routePrefix: "/reference",
    });
  }
}
