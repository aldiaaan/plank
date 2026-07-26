import { initializeDatabase } from "@plank/db";
import { asValue } from "awilix";

import { ServerModule } from "@/server/module";
import type { ModuleRegistrationContext } from "@/server/types";

export type DatabaseModuleOptions = {
  databaseUrl: string;
};

export class DatabaseModule extends ServerModule {
  name = "database";

  constructor(private readonly options: DatabaseModuleOptions) {
    super();
  }

  async register(context: ModuleRegistrationContext) {
    const db = initializeDatabase({ url: this.options.databaseUrl });
    context.container.register({
      db: asValue(db),
    });
  }
}
