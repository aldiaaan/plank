import { ServerModule } from "./module";

export type PlankServerOptions = {
  port: number;
  modules: ServerModule[];
};
