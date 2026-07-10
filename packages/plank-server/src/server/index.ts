import { fastify } from "fastify";
import { PlankServerOptions } from "./types";

export class PlankServer {
  private readonly app = fastify({ logger: true });

  constructor(
    private readonly options: PlankServerOptions = {
      port: 4000,
      modules: [],
    },
  ) {}

  async start() {
    this.app.log.info(`Starting Plank server on port ${this.options.port}`);

    this.app.get("/ping", (_request, reply) => {
      reply.send("pong");
    });

    for (const module of this.options.modules) {
      this.app.log.info(`Registering module ${module.name}`);
      await module.register(this.app);
    }

    await this.app.listen({ port: this.options.port, host: "0.0.0.0" });
  }
}
