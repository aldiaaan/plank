import type { AwilixContainer } from "awilix";
import type {
  ContextConfigDefault,
  FastifyBaseLogger,
  FastifyInstance,
  FastifySchema,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerDefault,
  RouteGenericInterface,
  RouteHandlerMethod,
  RouteOptions as FastifyRouteOptions,
} from "fastify";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { Database, Permission } from "@plank/db";
import type Redis from "ioredis";
import type { ServerModule } from "./module";
import type { EventBus } from "../modules/event-bus/event-bus.module";
import { SessionService } from "@/modules/session/session.service";

export type RequestUser = {
  id: string;
  email: string;
  name: string;
  permissions: Permission[];
};

export type RequestLocals = {
  user: RequestUser | null;
};

export type PlankServerOptions = {
  port: number;
  modules: ServerModule[];
  allowedOrigin?: string | string[] | boolean;
};

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

export type ModuleRegistrationCradle = {
  db: Database;
  eventBus: EventBus;
  sessionService: SessionService;
  redis: Redis;
};
export type ModuleRegistrationContext = {
  app: PlankFastifyInstance;
  container: AwilixContainer<ModuleRegistrationCradle>;
  config: PlankServerOptions;
};

export type DocumentationModuleOptions = {
  baseUrl: string;
};

declare module "fastify" {
  interface FastifyRequest {
    container: AwilixContainer<ModuleRegistrationCradle>;
    locals: RequestLocals;
  }

  interface FastifyContextConfig {
    allow?: Permission[];
  }
}
