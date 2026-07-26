import { createClient } from "@hey-api/openapi-ts";
import {
  AuthModule,
  DatabaseModule,
  DocumentationModule,
  HealthcheckModule,
  PlankServer,
  RolesModule,
  SessionModule,
  UserModule,
} from "@plank/server";

async function main() {
  // OpenAPI-only bootstrap — never listens. Avoids racing codegen:watch /
  // just codegen on a fixed port (previously 10000 → EADDRINUSE → stale client).
  const server = new PlankServer({
    port: 0,
    modules: [
      new DatabaseModule({
        databaseUrl:
          process.env.DATABASE_URL ?? "postgres://localhost:5432/plank",
      }),
      new DocumentationModule({ baseUrl: "http://localhost:4000" }),
      new HealthcheckModule(),
      new UserModule(),
      new RolesModule(),
      new SessionModule(),
      new AuthModule({}),
    ],
  });

  try {
    const openApi = await server.openApiDocument();
    await createClient({
      // Fastify's OpenAPI.Document lacks the index signature hey-api expects.
      input: openApi as Record<string, unknown>,
      output: "src/__generated__",
      plugins: ["@tanstack/react-query"],
    });
  } finally {
    await server.stop();
  }
}

main();
