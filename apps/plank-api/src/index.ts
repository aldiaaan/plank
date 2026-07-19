import {
  AuthModule,
  BackgroundJobModule,
  DatabaseModule,
  DocumentationModule,
  HealthcheckModule,
  PlankServer,
  RolesModule,
  SessionModule,
  UserModule,
} from "@plank/server";

async function main() {
  const modules = [];

  modules.push(
    new DatabaseModule({
      databaseUrl: process.env.DATABASE_URL!,
    }),
  );

  // Before DocumentationModule so Bull Board is not included in OpenAPI.
  modules.push(
    new BackgroundJobModule({
      redisUrl: process.env.REDIS_URL!,
    }),
  );

  modules.push(
    new DocumentationModule({
      baseUrl: process.env.API_BASE_URL ?? "http://localhost:4000",
    }),
  );

  modules.push(new HealthcheckModule());
  modules.push(new UserModule());
  modules.push(new RolesModule());
  modules.push(new SessionModule());
  modules.push(
    new AuthModule({
      initialSuperAdminEmail: process.env.SUPERADMIN_EMAIL,
      initialSuperAdminPassword: process.env.SUPERADMIN_PASSWORD,
    }),
  );

  const server = new PlankServer({
    port: 4000,
    modules,
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? false,
  });

  await server.start();
}

main();
