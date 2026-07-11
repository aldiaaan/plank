import type { AwilixContainer } from "awilix";
import { readdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { join } from "node:path";
import type {
  ContextConfigDefault,
  FastifyBaseLogger,
  FastifyInstance,
  FastifySchema,
  HTTPMethods,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
  RouteGenericInterface,
  RouteHandlerMethod,
  RouteOptions as FastifyRouteOptions,
  RouteShorthandOptionsWithHandler,
} from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  filenameToRoutePath,
  normalizeRouteExport,
} from "./utils/route";

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

export type PlankFastifyInstance = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>;

export type RouteHandler = RouteHandlerMethod<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  RouteGenericInterface,
  ContextConfigDefault,
  FastifySchema,
  TypeBoxTypeProvider,
  FastifyBaseLogger
>;

export type RouteOptions = Omit<
  FastifyRouteOptions<
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    RawReplyDefaultExpression<RawServerDefault>,
    RouteGenericInterface,
    ContextConfigDefault,
    FastifySchema,
    TypeBoxTypeProvider,
    FastifyBaseLogger
  >,
  "method" | "url" | "handler"
>;

export type RouteDefinition = RouteOptions & { handler: RouteHandler };

export type RouteExport = RouteHandler | RouteDefinition;

export type Route = {
  Handler: RouteHandler;
  Definition: RouteDefinition;
  Options: RouteOptions;
  Export: RouteExport;
};

export function defineRoute<
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault,
  const Schema extends FastifySchema = FastifySchema,
>(
  options: RouteShorthandOptionsWithHandler<
    RawServerDefault,
    RawRequestDefaultExpression<RawServerDefault>,
    RawReplyDefaultExpression<RawServerDefault>,
    RouteGeneric,
    ContextConfig,
    Schema,
    TypeBoxTypeProvider,
    FastifyBaseLogger
  >,
): RouteDefinition {
  return options as unknown as RouteDefinition;
}

export type ModuleRegistrationContext = {
  app: PlankFastifyInstance;
  container: AwilixContainer;
};

export abstract class ServerModule {
  abstract name: string;

  protected routePrefix(): string {
    return "";
  }

  protected routesDir(): URL {
    return new URL(`../modules/${this.name}/routes/`, import.meta.url);
  }

  async register(context: ModuleRegistrationContext): Promise<void> {
    await this.registerRoutes(context);
  }

  private async registerRoutes(
    context: ModuleRegistrationContext,
  ): Promise<void> {
    const dir = fileURLToPath(this.routesDir());
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return;
    }

    const routeFiles = entries.filter((file) => {
      if (file.endsWith(".d.ts")) return false;
      if (/\.(test|spec)\./.test(file)) return false;
      return /\.(ts|js|mjs|cjs)$/.test(file);
    });

    for (const file of routeFiles) {
      const moduleUrl = pathToFileURL(join(dir, file)).href;
      const mod = (await import(moduleUrl)) as Record<string, RouteExport>;

      const path = filenameToRoutePath(file);
      const url = `${this.routePrefix()}${path}` || "/";

      for (const method of HTTP_METHODS) {
        const exportValue = mod[method] as RouteExport | undefined;
        if (!exportValue) continue;

        const { handler, options } = normalizeRouteExport(exportValue);
        context.app.route({
          method: method as HTTPMethods,
          url,
          handler,
          ...options,
        });
        context.app.log.info(
          { module: this.name, method, url },
          `Registered route ${method} ${url}`,
        );
      }
    }
  }
}
