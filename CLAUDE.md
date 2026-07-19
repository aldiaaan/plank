# CLAUDE.md

Guidance for AI agents working in this repo.

## Server modules (`@plank/server`)

API features live as modules under `packages/plank-server/src/modules/<name>/`. Each extends `ServerModule` and is registered by `PlankServer`.

### Anatomy

```
packages/plank-server/src/modules/<name>/
  <name>.module.ts          # class extends ServerModule
  routes/
    index.ts                # → routePrefix() + ""
    $id.ts                  # → routePrefix() + "/:id"
    nested.$slug.ts         # → routePrefix() + "/nested/:slug"
  *.service.ts              # optional DI services
```

```ts
// modules/widgets/widgets.module.ts
export class WidgetsModule extends ServerModule {
  name = "widgets"; // must match folder name (used to find routes/)

  protected routePrefix(): string {
    return "/widgets";
  }
}
```

`name` drives `routesDir()` → `modules/<name>/routes/`. Missing `routes/` is fine (DI-only modules like `session`).

### Route files

Export HTTP method names (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, …). Prefer `route({ schema, handler })` from `ServerModule`.

```ts
// modules/widgets/routes/index.ts → GET /widgets
import { route } from "../../../server/module";
import { SuccessResponse } from "../../../server/responses";

export const GET = route({
  schema: {
    querystring: Type.Object({
      /* … */
    }),
    response: {
      200: SuccessResponse(
        Type.Object({
          /* … */
        }),
      ),
    },
  },
  handler: async (request, reply) => {
    const db = request.container.resolve("db");
    // …
    return reply.send({
      message: "ok",
      result: {
        /* … */
      },
    });
  },
});
```

Filename → path (appended to `routePrefix()`):

| File               | Path segment     |
| ------------------ | ---------------- |
| `index.ts`         | `""`             |
| `ping.ts`          | `/ping`          |
| `$id.ts`           | `/:id`           |
| `users.$userId.ts` | `/users/:userId` |

### Registration order

`PlankServer.start()` always registers in this order:

1. `ConnectionModule` — DB (`request.container.resolve("db")`)
2. `EventBusModule`
3. `SessionModule` — cookies + `sessionService` (no HTTP list routes)
4. **`options.modules`** — app modules (`DocumentationModule`, `UserModule`, `SessionsModule`, …)
5. `AuthModule` — `/auth/*` + populates `request.locals.user`

**OpenAPI / codegen:** `@fastify/swagger` is registered inside `DocumentationModule`. Only routes registered **after** that module appear in `/openapi.json`. Put list/CRUD modules in `options.modules` (after docs), not in the built-in early slots. That is why `SessionsModule` is separate from `SessionModule`.

### `register(context)`

Default `ServerModule.register` only loads `routes/`. Override it to attach Fastify plugins, hooks, or Awilix registrations.

```ts
async register(context: ModuleRegistrationContext) {
  // 1. Fastify plugins / hooks (optional)
  await context.app.register(somePlugin);

  // 2. Awilix registrations (optional)
  context.container.register({
    widgetService: asClass(WidgetService),
  });

  // 3. Load routes/ if this module has them
  await super.register(context);
}
```

Rules:

- Call `super.register(context)` **last** when the module has HTTP routes.
- DI-only modules (`ConnectionModule`, `SessionModule`, `EventBusModule`) skip `super.register`.
- Prefer registering dependencies before routes so handlers can resolve them immediately.
- `context.app` is the Fastify instance; `context.container` is the root Awilix container.

### Services + Awilix

`PlankServer` owns one root Awilix container. On each request it creates a **scope** (`request.container`) and disposes it after the response.

**Register in the module:**

| Helper                   | Use when                                          |
| ------------------------ | ------------------------------------------------- |
| `asValue(x)`             | Already-built instance (`db`)                     |
| `asClass(X)`             | Class; new instance per resolve / scope (default) |
| `asClass(X).singleton()` | One shared instance for the process (`eventBus`)  |

```ts
// connection.module.ts — value
context.container.register({
  db: asValue(db),
});

// session.module.ts — class (proxy / scoped)
context.container.register({
  sessionService: asClass(SessionService),
});

// event-bus.module.ts — singleton
context.container.register({
  eventBus: asClass(EventBus).singleton(),
});
```

**Service constructor injection** uses Awilix PROXY mode: parameter names must match cradle keys.

```ts
// session.service.ts
export class SessionService {
  private readonly db: Database;

  constructor({ db }: { db: Database }) {
    this.db = db;
  }

  async create(options: CreateSessionOptions) {
    /* uses this.db */
  }
}
```

Put services next to the module (`*.service.ts`). Keep DB access in `@plank/db` queries; services orchestrate those queries and domain rules.

**Resolve in routes / hooks:**

```ts
handler: async (request, reply) => {
  const db = request.container.resolve("db");
  const sessionService = request.container.resolve("sessionService");
  // …
};
```

Use `request.container` in route handlers and request hooks — not the root `context.container` — so scoped lifetimes work.

**Typing cradle keys:** when you add a new registration, extend `ModuleRegistrationCradle` in `packages/plank-server/src/server/types.ts` so `resolve("…")` stays typed:

```ts
export type ModuleRegistrationCradle = {
  db: Database;
  eventBus: EventBus;
  sessionService: SessionService;
  // widgetService: WidgetService;
};
```

### Wiring a new module

1. Create `modules/<name>/` + export the class from `packages/plank-server/src/index.ts`.
2. If you add a service, register it in `register()` and add the key to `ModuleRegistrationCradle`.
3. Push `new XModule()` in:
   - `apps/plank-api/src/index.ts`
   - `packages/plank-client/bin/codegen.ts` (same module list so OpenAPI matches)
4. Regenerate the client:

```bash
pnpm --filter @plank/client codegen
```

### Request context

- `request.container` — request-scoped Awilix scope (created `onRequest`, disposed `onResponse`)
- `request.locals.user` — set by `AuthModule` when a session cookie verifies (`null` otherwise)
- Root `context.container` — use only during `register()` (bootstrap), not inside handlers

## CRUD data tables (web)

Server-driven tables use `@plank/ui` `DataTable` + `@plank/client` React Query options. Sorting, filtering, and pagination are **manual** — the UI only emits state; the page fetches from the API.

Persist table state in the URL with `@plank/ui/hooks` (`useSortingSearchParams`, `useFilterSearchParams`, `usePaginationSearchParams`). Requires `NuqsAdapter` in the app root (see `apps/plank-web/src/root.tsx`).

Reference implementations:

- Users: `GET /users` → `listUsers` → `users-management.tsx` → `manage-users-page.tsx`
- Sessions: `GET /sessions` → `listSessions` → `sessions-management.tsx` → `manage-sessions-page.tsx`

Paths:

- API users: `packages/plank-server/src/modules/user/`
- API sessions: `packages/plank-server/src/modules/sessions/`
- DB users: `packages/plank-db/src/queries/users.ts`
- DB sessions: `packages/plank-db/src/queries/sessions.ts`
- Columns/filters: `apps/plank-web/src/common/tables/`
- Pages: `apps/plank-web/src/features/dashboard/components/`
- URL state: `packages/plank-ui/src/hooks/use-search-params.ts`

### 1. Backend list endpoint

Add a DB query with `search`, filters, `limit`, `offset`, and `total`. Return ISO date strings from the route.

```ts
// packages/plank-db/src/queries/<resource>.ts
listX(db, { search?, /* filters */, limit?, offset? })
  → { items, total, limit, offset }

// packages/plank-server/src/modules/<resource>/routes/index.ts
GET /<resources>?search=&limit=20&offset=0&…
  → { message: "ok", result: { items, total, limit, offset } }
```

Wire the module in `apps/plank-api` and `packages/plank-client/bin/codegen.ts`, then regenerate:

```bash
pnpm --filter @plank/client codegen
```

Prefer `SuccessResponse(...)` for the response schema.

### 2. Table schema file

Put columns + filterables under `apps/plank-web/src/common/tables/<name>.tsx`.

- Row type: derive from the generated client response (`GetXResponse["result"]["items"][number]`).
- `filterables`: `"text"` | `"select"` | `"multi-select"` | `"date-range"`.
- `columns`: TanStack `ColumnDef<Row>[]` with `cell` renderers.

Filter value shape from `DataTable`:

```ts
{ id: string; value?: { eq?: string | number; in?: (string | number | null)[]; gte?: string | number; lte?: string | number } }
```

Map filter IDs → API query params in the page (e.g. `search` ← `eq`, permissions ← `in`, dates ← `gte`/`lte`).

Pass URL sorting straight through to the list API as `SortInput[]` (`{ id, desc }`). nuqs only parses the browser URL (`id:asc|desc`); do not re-encode for the API.

```tsx
sorting: sorting.length > 0 ? sorting : undefined,
```

### 3. Page composition

```tsx
import {
  useFilterSearchParams,
  usePaginationSearchParams,
  useSortingSearchParams,
} from "@plank/ui/hooks";

const [sorting, setSorting] = useSortingSearchParams();
const [filters, setFilters] = useFilterSearchParams();
const [{ pageIndex: page, pageSize: perPage }, setPagination] =
  usePaginationSearchParams();

const offset = (page - 1) * perPage;

// ...

<TooltipProvider>
  <ScrollableProvider>
    <DataTable.Root data={items} columns={columns} sorting={sorting} onSortingChange={setSorting}>
      <DataTable.FilterButton
        filterables={...}
        value={filters}
        onChange={(next) => {
          void setFilters(next);
          void setPagination({ pageIndex: 1 });
        }}
      />
      <DataTable.ColumnSettings />
      <Scrollable className="min-h-0 flex-1 rounded-lg border">
        <DataTable.Content isLoading={isLoading || isFetching} border className="border-0" />
      </Scrollable>
      <DataTable.Pagination
        page={page}
        perPage={perPage}
        total={total}
        totalPages={totalPages}
        onPageChange={(next) => {
          void setPagination({ pageIndex: next });
        }}
        onPerPageChange={(next) => {
          void setPagination({ pageSize: next, pageIndex: 1 });
        }}
      />
    </DataTable.Root>
  </ScrollableProvider>
</TooltipProvider>
```

URL keys (via nuqs):

- `sorting` — `id:asc|desc` (multi)
- `filters` — qs-encoded filter objects (multi); date ranges use `range=gte...lte`
- `page`, `perPage` — pagination (`pageIndex` / `pageSize` in the hook)

Fetch with generated options + credentials:

```tsx
useQuery({
  ...getXOptions({
    query: {
      ...filtersToQuery(filters),
      sorting: sorting.length > 0 ? sorting : undefined,
      limit: perPage,
      offset,
    },
    credentials: "include",
  }),
});
```

Reset `page` to `1` when filters or `perPage` change.

### 4. Create / update / delete (mutations)

Pattern (when adding write endpoints):

1. Add `POST` / `PATCH` / `DELETE` routes on the resource module.
2. Regenerate `@plank/client`.
3. Use `useMutation({ ...postXMutation() })` (or patch/delete equivalents).
4. On success: `queryClient.invalidateQueries({ queryKey: getXQueryKey(...) })` (or the list query key you used).
5. Keep dialogs/forms outside `DataTable`; pass row actions via column `cell` (e.g. edit/delete buttons).

Do not put mutation logic inside `common/tables/*` — only columns and filterables live there.

### 5. Conventions

- One table schema file per admin resource under `src/common/tables/`.
- List APIs are paginated + filterable from day one.
- `DataTable` is uncontrolled for data: always pass `data` from the query result.
- Table UI state (sort / filters / page) lives in the URL via `@plank/ui/hooks` search-param hooks — not local `useState`.
- Wrap scrollable table bodies in `ScrollableProvider` + `Scrollable` so pagination can `scrollToTop`.
- Use `credentials: "include"` for authenticated API calls from the web app.
