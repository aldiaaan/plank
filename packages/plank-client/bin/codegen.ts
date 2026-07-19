import {
  DocumentationModule,
  HealthcheckModule,
  PlankServer,
  RolesModule,
  UserModule,
} from "@plank/server";
import { createClient } from "@hey-api/openapi-ts";

async function main() {
  const server = new PlankServer({
    port: 10000,
    // OpenAPI-only bootstrap — ConnectionModule needs a URL, but codegen
    // never queries the database.
    databaseUrl:
      process.env.DATABASE_URL ?? "postgres://localhost:5432/plank",
    modules: [
      new DocumentationModule({ baseUrl: "http://localhost:4000" }),
      new HealthcheckModule(),
      new UserModule(),
      new RolesModule(),
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
