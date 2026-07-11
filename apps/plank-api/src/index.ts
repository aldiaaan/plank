import {
  DocumentationModule,
  HealthcheckModule,
  PlankServer,
} from "@plank/server";

async function main() {
  const modules = [];

  if (process.env.NODE_ENV === "development") {
    modules.push(
      new DocumentationModule({
        baseUrl: "http://localhost:4000",
      }),
    );
  }

  modules.push(new HealthcheckModule());

  const server = new PlankServer({
    port: 4000,
    modules,
    databaseUrl: process.env.DATABASE_URL!,
  });

  await server.start();
}

main();
