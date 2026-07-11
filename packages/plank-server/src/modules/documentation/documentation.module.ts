import { ModuleRegistrationContext, ServerModule } from "../../server/module";

export type DocumentationModuleOptions = {
  baseUrl: string;
};

export class DocumentationModule extends ServerModule {
  name = "documentation";

  constructor(private readonly options?: DocumentationModuleOptions) {
    super();
  }

  async register(context: ModuleRegistrationContext) {
    await context.app.register(import("@fastify/swagger"), {
      openapi: {
        servers: [{ url: this.options?.baseUrl ?? "http://localhost:3000" }],
        info: {
          title: "API Reference",
          version: "1.0.0",
        },
      },
    });

    context.app.get("/openapi.json", { schema: { hide: true } }, async () =>
      context.app.swagger(),
    );

    await context.app.register(import("@scalar/fastify-api-reference"), {
      routePrefix: "/reference",
    });
  }
}
