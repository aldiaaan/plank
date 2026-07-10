import { fastify } from "fastify";
import { PlankServerOptions } from "./types";

export class PlankServer {
  private readonly app = fastify();

  constructor(
    private readonly options: PlankServerOptions = {
      port: 3000,
      modules: [],
    },
  ) {}

  async start() {
    this.app.get("/ping", (_request, reply) => {
      reply.send("pong");
    });

    for (const module of this.options.modules) {
      await module.register(this.app);
    }

    await this.app.listen({ port: this.options.port });
  }
}
