import { HealthcheckModule, PlankServer } from "@plank/server";

async function main() {
  const server = new PlankServer({
    port: 3000,
    modules: [new HealthcheckModule()],
  });
  await server.start();
}

main();
