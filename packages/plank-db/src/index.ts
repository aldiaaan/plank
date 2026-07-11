import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";

export type InitializeDatabaseOptions = {
  url: string;
};

export function initializeDatabase(options: InitializeDatabaseOptions) {
  return drizzle(options.url);
}

export type Database = Awaited<ReturnType<typeof initializeDatabase>>;

export type TransactionClient = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

export type DatabaseOrTransaction = Database | TransactionClient;
