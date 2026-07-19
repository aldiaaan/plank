import {
  DocumentationModule,
  HealthcheckModule,
  PlankServer,
  SessionsModule,
  UserModule,
} from "@plank/server";

async function main() {
  const modules = [];

  if (process.env.NODE_ENV === "development") {
    modules.push(
      new DocumentationModule({
        baseUrl: "http://localhost:4000",
      }),
    );
  }

  modules.push(new HealthcheckModule());
  modules.push(new UserModule());
  modules.push(new SessionsModule());

  const server = new PlankServer({
    port: 4000,
    modules,
    databaseUrl: process.env.DATABASE_URL!,
    allowedOrigin: process.env.ALLOWED_ORIGIN ?? false,
    superAdminEmail: process.env.SUPERADMIN_EMAIL,
    superAdminPassword: process.env.SUPERADMIN_PASSWORD,
  });

  await server.start();
}

main();
