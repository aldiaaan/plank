import { asValue } from "awilix";
import { ServerModule } from "../../server/module";
import type { ModuleRegistrationContext } from "../../server/types";
import { initializeDatabase } from "@plank/db";

export type ConnectionModuleOptions = {
  databaseUrl: string;
};

export class ConnectionModule extends ServerModule {
  name = "connection";

  constructor(private readonly options: ConnectionModuleOptions) {
    super();
  }

  async register(context: ModuleRegistrationContext) {
    const db = initializeDatabase({ url: this.options.databaseUrl });
    context.container.register({
      db: asValue(db),
    });
  }
}
