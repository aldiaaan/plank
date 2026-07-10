import { ProductionServer } from "../server/production-server";

async function main() {
  const server = new ProductionServer({
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  });

  await server.start();
}

main().catch(console.error);
