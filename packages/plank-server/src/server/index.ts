import cors from "@fastify/cors";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import * as awilix from "awilix";
import { fastify } from "fastify";
import qs from "qs";

import { EventBusModule } from "@/modules/event-bus/event-bus.module";
import { ClientError, ServerError } from "@/server/errors";
import type { ModuleRegistrationContext, PlankServerOptions } from "@/server/types";

export class PlankServer {
  private readonly container = awilix.createContainer();
  private modulesRegistered = false;
  private readonly app = fastify({
    // Nested query objects (e.g. sorting[0][id]=…) need qs; Node's parser keeps flat keys.
    querystringParser: (str) => qs.parse(str),
    ajv: {
      customOptions: {
        // Coerce query strings into schema types (e.g. "true" → boolean),
        // including a single scalar into an array when the schema expects one
        // (e.g. permissions=write:all → ["write:all"]).
        coerceTypes: "array",
      },
    },
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

  async initializeErrorHandlers() {
    this.app.setErrorHandler(async (error, _request, reply) => {
      const stack = (error as Error).stack;
      console.log({ error });
      if (error instanceof ClientError) {
        reply.status(error.statusCode).send(error.toJSON());
      } else if (error instanceof ServerError) {
        const json = error.toJSON();
        reply.status(error.statusCode).send({
          ...json,
          message:
            json.message + process.env.NODE_ENV === "development"
              ? " " + stack
              : "",
        });
      } else {
        reply.status(500).send({
          ...new ServerError().toJSON(),
        });
      }
    });
  }

  /**
   * Register plugins + modules without listening. Used by `start()` and by
   * codegen (`openApiDocument()`), which must not fight over a fixed port.
   */
  private async registerModules() {
    if (this.modulesRegistered) return;

    await this.initializeErrorHandlers();

    await this.app.register(cors, {
      origin: this.options.allowedOrigin ?? false,
      credentials: true,
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    });

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

    // Put BackgroundJobModule in options.modules before DocumentationModule
    // so Bull Board stays out of /openapi.json. Session/Auth after docs.
    // DatabaseModule should be first in options.modules (registers `db`).
    for (const module of [
      new EventBusModule(),
      ...this.options.modules,
    ]) {
      this.app.log.info(`Registering module ${module.name}`);
      await module.register(context);
    }

    this.modulesRegistered = true;
  }

  async start() {
    this.app.log.info(`Starting Plank server on port ${this.options.port}`);

    await this.registerModules();

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

  /** Build the OpenAPI document in-process (no TCP listen). */
  async openApiDocument() {
    await this.registerModules();
    await this.app.ready();
    return this.app.swagger();
  }

  async stop() {
    await this.app.close();
    await this.container.dispose();
  }
}
