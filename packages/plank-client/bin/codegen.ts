import { open, stat, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

import { createClient } from "@hey-api/openapi-ts";
import {
  AuthModule,
  DatabaseModule,
  DocumentationModule,
  HealthcheckModule,
  PlankServer,
  RolesModule,
  SessionModule,
  UserModule,
} from "@plank/server";

const LOCK_PATH = fileURLToPath(new URL("../.codegen.lock", import.meta.url));
const LOCK_STALE_MS = 60_000;
const LOCK_WAIT_MS = 60_000;

async function withCodegenLock<T>(fn: () => Promise<T>): Promise<T> {
  const started = Date.now();

  while (true) {
    try {
      const handle = await open(LOCK_PATH, "wx");
      await handle.writeFile(String(process.pid));
      await handle.close();
      break;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") throw error;

      try {
        const info = await stat(LOCK_PATH);
        if (Date.now() - info.mtimeMs > LOCK_STALE_MS) {
          await unlink(LOCK_PATH);
          continue;
        }
      } catch {
        // Lock disappeared between EEXIST and stat — retry acquire.
        continue;
      }

      if (Date.now() - started > LOCK_WAIT_MS) {
        throw new Error(
          `Timed out waiting for codegen lock at ${LOCK_PATH}. Another codegen may be stuck.`,
        );
      }
      await sleep(200);
    }
  }

  try {
    return await fn();
  } finally {
    await unlink(LOCK_PATH).catch(() => undefined);
  }
}

async function generate() {
  // OpenAPI-only bootstrap — never listens. Avoids racing codegen:watch /
  // just codegen on a fixed port (previously 10000 → EADDRINUSE → stale client).
  const server = new PlankServer({
    port: 0,
    modules: [
      new DatabaseModule({
        databaseUrl:
          process.env.DATABASE_URL ?? "postgres://localhost:5432/plank",
      }),
      new DocumentationModule({ baseUrl: "http://localhost:4000" }),
      new HealthcheckModule(),
      new UserModule(),
      new RolesModule(),
      new SessionModule(),
      new AuthModule({}),
    ],
  });

  try {
    const openApi = await server.openApiDocument();
    await createClient({
      // Fastify's OpenAPI.Document lacks the index signature hey-api expects.
      input: openApi as Record<string, unknown>,
      output: "src/__generated__",
      plugins: ["@tanstack/react-query"],
    });
  } finally {
    await server.stop();
  }
}

async function main() {
  await withCodegenLock(generate);
}

main();
