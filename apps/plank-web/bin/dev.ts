// import { killPort } from "@plank/server";
import { DevelopmentServer } from "../server/development-server";

async function main() {
  const port = 3000;
  // await killPort(port);

  const server = new DevelopmentServer({ port });
  await server.start();
}

main().catch(console.error);
