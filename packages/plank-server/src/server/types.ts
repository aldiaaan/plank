import type { AwilixContainer } from "awilix";
import { ServerModule } from "./module";

export type PlankServerOptions = {
  port: number;
  modules: ServerModule[];
};

declare module "fastify" {
  interface FastifyRequest {
    container: AwilixContainer;
    // container: AwilixContainer | null;
  }
}
