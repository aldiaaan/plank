import { fastify } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import * as awilix from "awilix";
import type { ModuleRegistrationContext, PlankServerOptions } from "./types";
import { EventBusModule } from "../modules/event-bus/event-bus.module";
import { ConnectionModule } from "../modules/connection/connection.module";
import { AuthModule } from "../modules/auth/auth.module";

export class PlankServer {
  private readonly container = awilix.createContainer();
  private readonly app = fastify({
    logger:
      process.env.NODE_ENV === "development"
        ? {
            transport: {
              target: "pino-pretty",
              options: {
                colorize: true,
                translateTime: "yyyy/mm/dd - HH:MM:ss",
                ignore: "pid,hostname",
              },
            },
          }
        : true,
  }).withTypeProvider<TypeBoxTypeProvider>();

  constructor(private readonly options: PlankServerOptions) {}

  async start() {
    this.app.log.info(`Starting Plank server on port ${this.options.port}`);

    this.app.decorateRequest(
      "container",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - TODO: give better type to the container
      null as unknown as awilix.AwilixContainer,
    );

    this.app.addHook("onRequest", async (request) => {
      request.container = this.container.createScope();
    });

    this.app.addHook("onResponse", async (request) => {
      await request.container.dispose();
    });

    const context: ModuleRegistrationContext = {
      app: this.app,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - TODO: give better type to the container
      container: this.container,
    };

    for (const module of [
      new ConnectionModule({ databaseUrl: this.options.databaseUrl }),
      new EventBusModule(),
      ...this.options.modules,
      new AuthModule({
        initialSuperAdminEmail: this.options.superAdminEmail,
        initialSuperAdminPassword: this.options.superAdminPassword,
      }),
    ]) {
      this.app.log.info(`Registering module ${module.name}`);
      await module.register(context);
    }

    const shutdownSignals = ["SIGTERM", "SIGINT"];

    shutdownSignals.forEach((signal) => {
      process.on(signal, async () => {
        this.app.log.info(
          `Received ${signal}, beginning graceful server teardown.`,
        );
        await this.stop();
      });
    });

    await this.app.listen({ port: this.options.port, host: "0.0.0.0" });
  }

  async stop() {
    await this.app.close();
    await this.container.dispose();
  }
}
