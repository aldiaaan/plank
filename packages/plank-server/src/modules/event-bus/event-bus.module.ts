import { asClass } from "awilix";

import { ServerModule } from "../../server/module";
import type { ModuleRegistrationContext } from "../../server/types";

export class EventBus {
  constructor() {}

  async publish(event: string) {
    console.log("Publishing event:", event);
  }

  async subscribe(event: string) {
    console.log("Subscribing to event:", event);
  }
}

export class EventBusModule extends ServerModule {
  name = "event-bus";

  async register(context: ModuleRegistrationContext) {
    context.container.register({
      eventBus: asClass(EventBus).singleton(),
    });
  }
}
