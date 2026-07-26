import path from "node:path";
import { pathToFileURL } from "node:url";

import { createRequestHandler } from "@react-router/express";
import express, { type Express } from "express";
import { pinoHttp } from "pino-http";

import { BaseServer, type ServerOptions } from "./base-server";

export class ProductionServer extends BaseServer {
  _express: Express;

  constructor(options: ServerOptions) {
    super(options);
    this._express = express();
  }

  async start(): Promise<void> {
    await this.initialize();

    const server = this._express.listen(this.port, () => {
      console.log(
        `\n🚀 Server running at port ${this.port}\n` +
          `🛠️  Mode: ${process.env.NODE_ENV ?? "???"}\n`,
      );
    });

    ["SIGTERM", "SIGINT"].forEach((signal) => {
      process.once(signal, () => server?.close(console.error));
    });
  }

  async initialize(): Promise<void> {
    const modulePath = pathToFileURL(
      path.resolve("dist/server/module.js"),
    ).href;

    this._express.use(
      pinoHttp({
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        serializers: {
          req: (req: Request) => ({ method: req.method, url: req.url }),
        },
      }),
    );

    this._express.use(
      "/assets",
      express.static("dist/client/assets", {
        immutable: true,
        maxAge: "1y",
        setHeaders: (res, path) => {
          if (path.endsWith(".html")) {
            res.set("Cache-Control", "public, max-age=0, must-revalidate");
          }
        },
      }),
    );

    this._express.use(express.static("dist/client", { maxAge: "1h" }));

    const module = await import(modulePath);

    this._express.get(
      "/.well-known/appspecific/com.chrome.devtools.json",
      (req, res) => {
        res.status(404).end();
      },
    );

    if (module.fetch) {
      // this._express.all("*", createRequestListener(module.fetch));
    } else {
      this._express.all(
        "{*splat}",
        createRequestHandler({
          build: module,
          mode: process.env.NODE_ENV,
        }),
      );
    }
  }
}
