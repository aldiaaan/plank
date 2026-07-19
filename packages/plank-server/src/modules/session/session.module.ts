import cookie from "@fastify/cookie";
import { asClass } from "awilix";
import type { ModuleRegistrationContext } from "../../server/types";
import { ServerModule } from "../../server/module";
import { SessionService } from "./session.service";

export class SessionModule extends ServerModule {
  name = "session";

  async register(context: ModuleRegistrationContext) {
    await context.app.register(cookie);

    context.container.register({
      sessionService: asClass(SessionService),
    });
  }
}
