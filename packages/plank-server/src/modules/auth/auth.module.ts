import type { Database } from "@plank/db";
import { initializeSuperAdmin } from "@plank/db/auth";
import type { FastifyBaseLogger } from "fastify";

import { ServerModule } from "../../server/module";
import type {
  ModuleRegistrationContext,
  RequestLocals,
} from "../../server/types";
import { SESSION_COOKIE_NAME } from "../session/constants";
import { ForbiddenError, UnauthorizedError } from "./errors";
import { hashPassword } from "./utils";

export type AuthModuleOptions = {
  initialSuperAdminEmail?: string;
  initialSuperAdminPassword?: string;
};

export class AuthModule extends ServerModule {
  name = "auth";

  constructor(private readonly options: AuthModuleOptions) {
    super();
  }

  protected routePrefix(): string {
    return "/auth";
  }

  shouldInitializeSuperAdmin(): boolean {
    return (
      !!this.options.initialSuperAdminEmail &&
      !!this.options.initialSuperAdminPassword
    );
  }

  async register(context: ModuleRegistrationContext): Promise<void> {
    if (this.shouldInitializeSuperAdmin()) {
      const db = context.container.resolve("db");
      await this.ensureSuperAdmin(db, context.app.log);
    }

    context.app.decorateRequest("locals", null as unknown as RequestLocals);

    // 1. Existing Session Check (Runs first)
    context.app.addHook("onRequest", async (request) => {
      request.locals = { user: null };

      const token = request.cookies[SESSION_COOKIE_NAME];
      if (!token) return;

      try {
        const sessionService = request.container.resolve("sessionService");
        const result = await sessionService.verify(token);
        request.locals.user = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          permissions: result.permissions,
        };
      } catch {
        request.locals.user = null;
      }
    });

    // 2. New Permissions Check (Runs after session check)
    context.app.addHook("preHandler", async (request) => {
      const allowedPermissions = request.routeOptions.config.allow;

      // If no permissions specified, the route is public
      if (!allowedPermissions || allowedPermissions.length === 0) {
        return;
      }

      const user = request.locals.user;

      // If permissions are required but no valid session exists
      if (!user) {
        throw new UnauthorizedError();
      }

      // Check for overlap between allowed and user's permissions
      const hasPermission = allowedPermissions.some((permission) =>
        user.permissions.includes(permission),
      );

      if (!hasPermission) {
        throw new ForbiddenError();
      }
    });

    await super.register(context);
  }

  private async ensureSuperAdmin(
    db: Database,
    log: FastifyBaseLogger,
  ): Promise<void> {
    const email = this.options.initialSuperAdminEmail!;
    const password = this.options.initialSuperAdminPassword!;

    const result = await initializeSuperAdmin(db, {
      email,
      credential: await hashPassword(password),
    });

    if (result === "skipped") {
      log.info("Super admin already exists, skipping initialization");
      return;
    }

    log.info({ email }, "Initialized super admin");
  }
}
