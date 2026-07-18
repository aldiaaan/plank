import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "./relations";

export type InitializeDatabaseOptions = {
  url: string;
};

export function initializeDatabase(options: InitializeDatabaseOptions) {
  return drizzle({
    connection: {
      connectionString: options.url,
    },
    relations,
  });
}

export type Database = Awaited<ReturnType<typeof initializeDatabase>>;

export type TransactionClient = Parameters<
  Parameters<Database["transaction"]>[0]
>[0];

export type DatabaseOrTransaction = Database | TransactionClient;

export * from "./schema";
export { relations } from "./relations";
