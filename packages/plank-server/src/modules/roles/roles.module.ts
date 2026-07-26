import { ServerModule } from "@/server/module";

export class RolesModule extends ServerModule {
  name = "roles";

  protected routePrefix(): string {
    return "/roles";
  }
}
