# Plank

Monorepo for the Plank web app and API. pnpm workspaces + Turborepo.

## Structure

| Path | Package | Role |
| --- | --- | --- |
| `apps/plank-api` | `@plank/api` | API entrypoint (Fastify via `@plank/server`) |
| `apps/plank-web` | `@plank/web` | React Router web app |
| `packages/plank-server` | `@plank/server` | Modular Fastify server (auth, sessions, DI, OpenAPI) |
| `packages/plank-db` | `@plank/db` | Drizzle schema, migrations, query helpers |
| `packages/plank-client` | `@plank/client` | OpenAPI-generated TypeScript + React Query client |
| `packages/plank-ui` | `@plank/ui` | Shared UI |
| `packages/plank-common` | `@plank/common` | Shared utilities |
| `packages/plank-eslint` | `@plank/eslint` | Shared ESLint config |
| `packages/plank-tsconfig` | `@plank/tsconfig` | Shared TypeScript config |

## Prerequisites

- Node.js
- [pnpm](https://pnpm.io) `11.11.0` (see `packageManager` in root `package.json`)
- [Docker](https://www.docker.com/) (Postgres + pgweb)
- [just](https://github.com/casey/just) (optional; runs the recipes in `justfile`)

## Quick start

```bash
just setup          # pnpm install
cp apps/plank-api/.env.example apps/plank-api/.env
cp packages/plank-db/.env.example packages/plank-db/.env
just infra          # Postgres on :5432, pgweb on :8081
just db generate    # when schema changes
just db migrate     # apply migrations (drizzle-kit)
just dev            # infra + web, api, client codegen, db studio
```

Without `just`:

```bash
pnpm install
docker compose up -d
pnpm --filter @plank/db exec drizzle-kit migrate
pnpm exec turbo run dev codegen:watch \
  --filter=@plank/web --filter=@plank/api --filter=@plank/client --filter=@plank/db --parallel
```

### Local services

| Service | URL |
| --- | --- |
| API | http://localhost:4000 |
| API reference (dev) | http://localhost:4000/reference |
| OpenAPI JSON (dev) | http://localhost:4000/openapi.json |
| Web | (see `@plank/web` Vite / React Router ports) |
| pgweb | http://localhost:8081 |

Default DB URL (compose):

```text
postgres://plank:plank@localhost:5432/plank?sslmode=disable
```

## Auth (in progress)

Email/password (`basic` provider) with DB-backed sessions.

- **Schema** (`@plank/db`): `users`, `accounts` (provider + credential), `sessions` (id + `secret_hash`), `roles` / `user_roles`
- **API** (`@plank/server`): `AuthModule` at `/auth` (e.g. `POST /auth/login`); optional super-admin bootstrap via `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`
- **Passwords**: Argon2id via `@node-rs/argon2`

Wire env on the API (extend `.env` from `.env.example` as needed):

```bash
DATABASE_URL=postgres://plank:plank@localhost:5432/plank?sslmode=disable
SUPERADMIN_EMAIL=admin@example.com
SUPERADMIN_PASSWORD=change-me
```

## Common commands

```bash
just setup                 # install deps
just infra                 # start Docker services
just clean                 # docker compose down -v
just dev                   # full local stack
just codegen               # regenerate @plank/client from OpenAPI
just db <drizzle-kit-args> # e.g. just db studio / generate / migrate
```

## Notes

- Server modules live under `packages/plank-server/src/modules/<name>/` with file-based routes in `routes/`.
- Client SDK is generated from the live OpenAPI document (`packages/plank-client/bin/codegen.ts`).
- See `TODO.md` for the temporary TypeScript 6/7 dual-alias setup used for ESLint vs `tsc`.
