export const ENVIRONMENT = process.env.NODE_ENV ?? "development";
export const isDevelopment = ENVIRONMENT === "development";
export const isProduction = ENVIRONMENT === "production";
export const databaseUrl = process.env.DATABASE_URL!;
