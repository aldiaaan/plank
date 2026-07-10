export type ServerOptions = {
  port?: number;
};

export abstract class BaseServer {
  protected port: number;

  constructor(options: ServerOptions) {
    this.port = options.port ?? 3000;
  }

  abstract start(): Promise<void>;
  abstract initialize(): Promise<void>;
}
