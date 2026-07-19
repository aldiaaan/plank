import { ServerModule } from "../../server/module";

export class SessionsModule extends ServerModule {
  name = "sessions";

  protected routePrefix(): string {
    return "/sessions";
  }
}
