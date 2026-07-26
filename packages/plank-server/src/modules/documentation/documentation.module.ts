import { ServerModule } from "@/server/module";
import type {
  DocumentationModuleOptions,
  ModuleRegistrationContext,
} from "@/server/types";

const SCALAR_ROUTE_PREFIX = "/externals/scalar";

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

    // Left public so codegen can fetch the schema without a session.
    context.app.get("/openapi.json", { schema: { hide: true } }, async () =>
      context.app.swagger(),
    );

    await context.app.register(
      async (scoped) => {
        scoped.addHook("onRoute", (routeOptions) => {
          routeOptions.config = {
            ...routeOptions.config,
            allow: ["read:all"],
          };
        });
        await scoped.register(import("@scalar/fastify-api-reference"), {
          routePrefix: "/",
        });
      },
      { prefix: SCALAR_ROUTE_PREFIX },
    );
  }
}
