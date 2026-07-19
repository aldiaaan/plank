import {
  DocumentationModule,
  HealthcheckModule,
  PlankServer,
  UserModule,
} from "@plank/server";
import { createClient } from "@hey-api/openapi-ts";

async function main() {
  const server = new PlankServer({
    port: 10000,
    modules: [
      new DocumentationModule({ baseUrl: "http://localhost:4000" }),
      new HealthcheckModule(),
      new UserModule(),
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
