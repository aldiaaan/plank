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
  const server = new PlankServer({
    port: 10000,
    // OpenAPI-only bootstrap — DatabaseModule needs a URL, but codegen
    // never queries the database. BackgroundJobModule is omitted (no Redis).
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

  await server.start();

  try {
    await createClient({
      input: "http://localhost:10000/openapi.json",
      output: "src/__generated__",
      plugins: ["@tanstack/react-query"],
    });
  } finally {
    await server.stop();
  }
}

main();
