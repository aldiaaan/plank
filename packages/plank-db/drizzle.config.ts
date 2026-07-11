import "dotenv/config";

import type { Config } from "drizzle-kit";
import { databaseUrl } from "./src/constants";

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config;
