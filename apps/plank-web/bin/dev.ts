import { DevelopmentServer } from "../server/development-server";

async function main() {
  const server = new DevelopmentServer({
    port: 3000,
  });

  await server.start();
}

main().catch(console.error);
