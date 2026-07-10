import {
  DocumentationModule,
  HealthcheckModule,
  PlankServer,
} from "@plank/server";

async function main() {
  const modules = [new HealthcheckModule()];

  if (process.env.NODE_ENV === "development") {
    modules.push(new DocumentationModule());
  }

  const server = new PlankServer({
    port: 4000,
    modules,
  });

  await server.start();
}

main();
