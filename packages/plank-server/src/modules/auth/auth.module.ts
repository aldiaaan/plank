import type { Database } from "@plank/db";
import { initializeSuperAdmin } from "@plank/db/auth";
import type { FastifyBaseLogger } from "fastify";
import { ModuleRegistrationContext } from "../../server/types";
import { ServerModule } from "../../server/module";
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
