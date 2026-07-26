import cookie from "@fastify/cookie";
import { asClass } from "awilix";

import { ServerModule } from "@/server/module";
import type { ModuleRegistrationContext } from "@/server/types";
import { SessionService } from "@/modules/session/session.service";

export class SessionModule extends ServerModule {
  name = "session";

  protected routePrefix(): string {
    return "/sessions";
  }

  async register(context: ModuleRegistrationContext) {
    await context.app.register(cookie);

    context.container.register({
      sessionService: asClass(SessionService),
    });

    await super.register(context);
  }
}
