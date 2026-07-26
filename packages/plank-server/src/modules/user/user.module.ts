import { ServerModule } from "@/server/module";

export class UserModule extends ServerModule {
  name = "user";

  protected routePrefix(): string {
    return "/users";
  }
}
