import crypto from "node:crypto";
import { createServer, Server as HttpServer } from "node:http";
import path from "node:path";

import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import pretty from "pino-pretty";

import { BaseServer, type ServerOptions } from "./base-server";

export class DevelopmentServer extends BaseServer {
  _express: Express;
  _server: HttpServer;

  constructor(options: ServerOptions) {
    super(options);
    this._express = express();
    this._server = createServer(this._express);

    this._express.use((req, res, next) => {
      const nonce = crypto.randomBytes(32).toString("base64");
      res.locals.nonce = nonce;
      req.headers["x-csp-nonce"] = nonce;
      next();
    });

    this._express.use(
      helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
          "script-src": [
            "'self'",
            (_req, res) => `'nonce-${(res as express.Response).locals.nonce}'`,
          ],
          // If using Vite in dev mode, you might need 'unsafe-inline' for style-src HMR
          "style-src": ["'self'", "'unsafe-inline'"],
          "connect-src": [
            "'self'",
            process.env.API_URL!,
            "ws:",
            "wss:",
          ],
        },
      }),
    );
  }

  async start(): Promise<void> {
    await this.initialize();

    return new Promise<void>((resolve) => {
      this._server.listen(this.port, () => {
        console.log(
          `\n🚀 Server running at http://localhost:${this.port}\n` +
            `🛠️  Mode: ${process.env.NODE_ENV || "development"}\n`,
        );
        resolve();
      });
    });
  }

  async initialize(): Promise<void> {
    const vite = await import("vite");

    const server = await vite.createServer({
      clearScreen: false,
      server: {
        watch: {
          ignored: [
            "**/node_modules/**",
            "**/.git/**",
            "**/dist/**",
            "**/.react-router/**",
          ],
        },
        hmr: {
          server: this._server,
        },
        middlewareMode: true,
      },
      appType: "custom",
    });

    this._express.use(server.middlewares);

    this._express.use(
      pinoHttp({
        level: "debug",
        stream: pretty({
          colorize: true,
          translateTime: "yyyy/mm/dd - HH:MM:ss",
          ignore: "pid,hostname,req,res,responseTime",
          messageFormat:
            "{msg} | {req.method} | {req.url} | {res.statusCode} | {responseTime}ms",
        }),
      }),
    );

    this._express.use(async (req, res, next) => {
      try {
        const modules = await server.ssrLoadModule(
          path.join(process.cwd(), "src", "entry.node.ts"),
        );

        const handler = modules.app;
        await handler(req, res, next);
      } catch (error) {
        if (typeof error === "object" && error instanceof Error) {
          server.ssrFixStacktrace(error);
        }
        next(error);
      }
    });
  }
}
