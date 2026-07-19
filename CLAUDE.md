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
// modules/widget/widget.module.ts
export class WidgetModule extends ServerModule {
  name = "widget"; // must match folder name (used to find routes/)

  protected routePrefix(): string {
    return "/widgets"; // REST collection paths may be plural
  }
}
```

Module naming is **singular**, not plural: folder, `name`, and class (`user` / `UserModule`, not `users` / `UsersModule`). `routePrefix()` may still use a plural collection path (e.g. `/users`). `name` drives `routesDir()` → `modules/<name>/routes/`. Missing `routes/` is fine (DI-only modules like `connection` / `event-bus`).
### Route files

Export HTTP method names (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`, …). Prefer `route({ schema, handler })` from `ServerModule`.

**Route permissions:** declare required permissions on the route via Fastify `config.allow` (`Permission[]` from `@plank/db`). Typed on `FastifyContextConfig` in `server/types.ts`. Enforcement is not implemented yet — still declare `allow` on protected routes so the shape is ready:

```ts
export const GET = route({
  config: {
    allow: ["admin:read:users"],
  },
  schema: {
    // …
  },
  handler: async (request, reply) => {
    // …
  },
});
```

**Every endpoint must ship with OpenAPI docs** (via `@fastify/swagger` / `/openapi.json` / `/reference`). Incomplete schemas or missing tags are not acceptable — codegen and the API reference both depend on this.

Required on every route `schema`:

| Field | Purpose |
| ----- | ------- |
| `tags` | Group the operation (e.g. `["Users"]`, `["Auth"]`, `["Sessions"]`). Use the resource name; keep tags consistent across the module. |
| `summary` | Short title shown in the reference UI. |
| `description` | What the endpoint does, important query/body behavior, and side effects (cookies, auth, etc.). |
| request schemas | `body` / `querystring` / `params` as needed — typed with TypeBox (`format`, `minLength`, defaults, etc.). |
| `response` | Every status the handler can return (`200`/`201`, plus error statuses with `ErrorResponse`). Prefer `SuccessResponse(...)`. |

Add `description` on important TypeBox fields when the name alone is unclear.

Example (`POST /users` — see `modules/user/routes/index.ts`):

```ts
export const POST = route({
  schema: {
    tags: ["Users"],
    summary: "Create user",
    description:
      "Creates a user account with the given role. Returns 409 if the email is already taken, 400 if the role does not exist.",
    body: Type.Object({
      name: Type.String({ minLength: 1, description: "Display name" }),
      email: Type.String({ format: "email" }),
      password: Type.String({ minLength: 8 }),
      roleId: Type.String({
        format: "uuid",
        description: "Existing role id from GET /roles",
      }),
    }),
    response: {
      201: SuccessResponse(UserItem),
      400: ErrorResponse,
      409: ErrorResponse,
    },
  },
  handler: async (request, reply) => {
    // …
  },
});
```

List endpoints follow the same pattern (tags/summary/description + querystring + `200` response), e.g. `GET /users` with `search`, filters, `sorting`, `limit`, `offset`.

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
3. **`options.modules`** — app modules (`DocumentationModule`, `UserModule`, `RolesModule`, …)
4. `SessionModule` — cookies + `sessionService` + `GET /sessions`
5. `AuthModule` — `/auth/*` + populates `request.locals.user`

**OpenAPI / codegen:** `@fastify/swagger` is registered inside `DocumentationModule`. Only routes registered **after** that module appear in `/openapi.json`. Put list/CRUD modules in `options.modules` (after docs). `SessionModule` is built-in but registered **after** `options.modules` so its `/sessions` routes still appear in the OpenAPI doc when `DocumentationModule` is first in the list.

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
- DI-only modules (`ConnectionModule`, `EventBusModule`) skip `super.register`.
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

### Errors

API errors live in `packages/plank-server/src/server/errors.ts`:

| Base class | Use for |
| ---------- | ------- |
| `ClientError` | Expected / public failures the client may handle (validation, conflict, unauthorized, not found). Message and `code` are returned to the client. |
| `ServerError` | Internal failures that should not leak details. `toJSON()` always returns a generic message; unexpected thrown values are also wrapped as `ServerError` by the global handler. |

Do **not** throw bare `Error`, plain objects, or ad-hoc `{ message, statusCode }` shapes from routes/services. Define a typed class and `throw` it.

Put module-specific errors in `packages/plank-server/src/modules/<name>/errors.ts`, extending `ClientError` (or `ServerError` when appropriate):

```ts
// modules/user/errors.ts
import { ClientError } from "../../server/errors";

export class EmailAlreadyTakenError extends ClientError {
  message = "A user with this email already exists.";
  code = "ERR-USER-0001";
  statusCode = 409;
}

export class RoleNotFoundError extends ClientError {
  message = "The selected role was not found.";
  code = "ERR-USER-0002";
  statusCode = 400;
}
```

In the route: document matching statuses with `ErrorResponse`, then throw the class:

```ts
response: {
  201: SuccessResponse(UserItem),
  400: ErrorResponse,
  409: ErrorResponse,
},
// …
throw new EmailAlreadyTakenError();
```

Use stable `code` values prefixed by domain (`ERR-USER-…`, `ERR-0100`, …). Reference: `modules/user/errors.ts`, `modules/auth/errors.ts`, `modules/session/errors.ts`.

### Wiring a new module

A module is not live until it is exported from `@plank/server` and passed into `PlankServer` via `options.modules` — in **both** the real API and the codegen bootstrap (same list, so OpenAPI matches).

1. Create `packages/plank-server/src/modules/<name>/` (module class + `routes/` as needed).
2. Export the class from `packages/plank-server/src/index.ts`:

```ts
export { RolesModule } from "./modules/roles/roles.module";
```

3. If you add a service, register it in `register()` and add the key to `ModuleRegistrationCradle`.
4. Register the module in `apps/plank-api/src/index.ts` (after `DocumentationModule` in development so routes appear in Swagger):

```ts
import {
  DocumentationModule,
  HealthcheckModule,
  PlankServer,
  RolesModule,
  // …other modules
} from "@plank/server";

const modules = [];

if (process.env.NODE_ENV === "development") {
  modules.push(
    new DocumentationModule({ baseUrl: "http://localhost:4000" }),
  );
}

modules.push(new HealthcheckModule());
modules.push(new RolesModule()); // ← add here

const server = new PlankServer({
  port: 4000,
  modules,
  // …
});
```

5. Mirror the same module in `packages/plank-client/bin/codegen.ts`:

```ts
modules: [
  new DocumentationModule({ baseUrl: "http://localhost:4000" }),
  new HealthcheckModule(),
  new RolesModule(), // ← same order / set as plank-api
  // …
],
```

6. Regenerate the client:

```bash
pnpm --filter @plank/client codegen
```

Built-in modules (`ConnectionModule`, `EventBusModule`, `SessionModule`, `AuthModule`) are registered inside `PlankServer.start()` — do not push those into `options.modules`. App feature modules (`UserModule`, `RolesModule`, …) always go in `options.modules`.

### Request context

- `request.container` — request-scoped Awilix scope (created `onRequest`, disposed `onResponse`)
- `request.locals.user` — set by `AuthModule` when a session cookie verifies (`null` otherwise); includes `permissions: Permission[]`
- `request.routeOptions.config.allow` — optional `Permission[]` declared on the route (see Route files); not enforced yet
- Root `context.container` — use only during `register()` (bootstrap), not inside handlers

## Web app conventions (`plank-web`)

### Forms

- Use **react-hook-form** for every form or controlled input surface (create/edit pages, dialogs, login, settings, etc.).
- Do not manage form field state with ad-hoc `useState` / uncontrolled inputs when RHF fits.

### Dashboard form pages

When adding a create/edit form inside the dashboard, match the layout and field styling of `apps/plank-web/src/features/dashboard/components/create-user-page.tsx`:

- Outer shell: `mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col gap-6`
- Page header: `font-heading` title + short `text-sm text-muted-foreground` description
- Form: `flex flex-col gap-6`, `noValidate`, fields in `FieldGroup` / `Field` / `FieldLabel` / `FieldError` from `@plank/ui`
- Mark invalid fields with `data-invalid` on `Field` and `aria-invalid` on inputs
- Use `Controller` for selects and other non-native controls
- Actions: cancel + submit row with `ml-auto` (`outline` Cancel `Link` with `viewTransition`, primary submit)
- On success: toast, `queryClient.invalidateQueries({ queryKey: [{ _id: "getX" }] })`, navigate back to the related manage page
- Surface mutation errors as `text-sm text-destructive` above the actions

On the related manage / table page, put the create entry point in the page header (title + description on the left, primary button on the right) like `manage-roles-page.tsx` / `manage-users-page.tsx`:

```tsx
<div className="flex shrink-0 items-start justify-between gap-4">
  <div>
    <h1 className="text-xl font-semibold font-heading tracking-tight">
      Manage Roles
    </h1>
    <p className="text-sm text-muted-foreground">…</p>
  </div>
  <div>
    <Button asChild>
      <Link to="/dashboard/roles/create" viewTransition>
        Create Role
      </Link>
    </Button>
  </div>
</div>
```

### Compound overlays — `Trigger asChild` + `children` (required)

**This pattern is required — not optional.** It applies to **every** overlay that exposes a trigger with `asChild`: `DialogTrigger`, `PopoverTrigger`, `DropdownMenuTrigger`, `TooltipTrigger`, `SheetTrigger`, `Combobox` chips/triggers, and any future Radix-style trigger. Use it everywhere the trigger appears — DataTable cells, page headers, nav items, settings panels, menus, etc.

Encapsulate the overlay (and any mutation it owns) in a dedicated component. Callers pass the action context as props and **`children` as the trigger**. The component always wraps `children` with its `*Trigger asChild`.

**Minimal shape (Dialog):**

```tsx
function DeleteUserDialog({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>…</DialogContent>
    </Dialog>
  );
}

// usage — caller owns the trigger UI
<DeleteUserDialog userId={user.id}>
  <Button type="button" variant="ghost" size="icon-sm">
    Delete
  </Button>
</DeleteUserDialog>
```

**Same minimal shape for other overlays:**

```tsx
function RowActionsMenu({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent>…</DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilterPopover({ children }: { children: React.ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent>…</PopoverContent>
    </Popover>
  );
}

// usage
<RowActionsMenu>
  <Button type="button" variant="ghost" size="icon-sm">
    <MoreHorizontalIcon />
  </Button>
</RowActionsMenu>

<FilterPopover>
  <Button type="button" variant="outline" size="sm">
    Filter
  </Button>
</FilterPopover>
```

**Do not:**

- Hard-code the trigger button inside the overlay component (callers must own the trigger UI)
- Lift overlay open state to the page and wire a bare `<Dialog>` / `<Popover>` / `<DropdownMenu>` beside the call site
- Put mutation / toast / invalidation in `common/tables/*` or scatter it across the page

**Do:**

- Always wrap `children` with the matching `*Trigger asChild` (`DialogTrigger`, `PopoverTrigger`, `DropdownMenuTrigger`, …)
- Pass a **single** element as `children` (must accept ref + props for Radix `asChild`)
- Keep overlay state, side effects, and mutations inside the dedicated component
- Reuse this shape for every similar overlay (`DeleteRoleDialog`, filter popovers, row action menus, …)

Reference: `features/dashboard/components/delete-user-dialog.tsx`

### Remote data

- Use **TanStack React Query** (`useQuery` / `useMutation`) for all remote data.
- Prefer the generated options/mutation helpers from `@plank/client` (e.g. `getUsersOptions`, `postAuthLoginMutation`) — do not hand-roll `fetch` wrappers or API clients.
- Do **not** create custom data hooks (`useUsers`, `useCreateUser`, …) unless it is really necessary (shared non-trivial orchestration used in several places). Prefer calling `useQuery` / `useMutation` with the generated helpers directly in the page or component.

### Generated API client (`@plank/client`)

- After adding or changing server routes/schemas, regenerate the client:

```bash
pnpm --filter @plank/client codegen
```

- Wire the same modules in `apps/plank-api/src/index.ts` and `packages/plank-client/bin/codegen.ts` so OpenAPI matches.
- Import types and SDK helpers from `@plank/client` only — never duplicate endpoint URLs, request shapes, or response types by hand.
- Authenticated browser calls must pass `credentials: "include"`.

### Navigation

- Always pass `viewTransition` on every React Router `Link` / `NavLink` (and any `Link` used via `asChild`).

```tsx
<Link to="/dashboard/users" viewTransition>
  Cancel
</Link>

<NavLink to={item.url} viewTransition>
  {item.title}
</NavLink>
```

### Page metadata

- Every route module must export a React Router `meta` function with at least `title` and `description`.
- Title format: `"<Page name> | Plank"` (root may use `"Plank"` alone).
- Import typed `Route` from `./+types/<file-name>` (generated by React Router).

```tsx
import type { Route } from "./+types/manage-users-page";

export const meta: Route.MetaFunction = () => [
  { title: "Manage Users | Plank" },
  {
    name: "description",
    content: "Search and filter users by permissions and registration date.",
  },
];
```

Reference: `features/home/auth/components/login-page.tsx`.

## CRUD data tables (web)

Server-driven tables use `@plank/ui` `DataTable` + `@plank/client` React Query options. Sorting, filtering, and pagination are **manual** — the UI only emits state; the page fetches from the API.

Persist table state in the URL with `@plank/ui/hooks` (`useSortingSearchParams`, `useFilterSearchParams`, `usePaginationSearchParams`). Requires `NuqsAdapter` in the app root (see `apps/plank-web/src/root.tsx`).

Reference implementations:

- Users: `GET /users` → `listUsers` → `users-management.tsx` → `manage-users-page.tsx` (+ `create-user-page.tsx`)
- Sessions: `GET /sessions` → `listSessions` → `sessions-management.tsx` → `manage-sessions-page.tsx`
- Roles: `GET /roles` → `listRoles` → `roles-management.tsx` → `manage-roles-page.tsx` (+ `create-role-page.tsx`)

Paths:

- API users: `packages/plank-server/src/modules/user/`
- API sessions: `packages/plank-server/src/modules/session/`
- API roles: `packages/plank-server/src/modules/roles/`
- DB users: `packages/plank-db/src/queries/users.ts`
- DB sessions: `packages/plank-db/src/queries/sessions.ts`
- DB roles: `packages/plank-db/src/queries/roles.ts`
- Columns/filters: `apps/plank-web/src/common/tables/`
- Pages: `apps/plank-web/src/features/dashboard/components/`
- URL state: `packages/plank-ui/src/hooks/use-search-params.ts`
- Query error empty: `packages/plank-ui/src/components/query-error.tsx`

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
  - Select / multi-select: static `options`, or async `loadOptions({ search })` for REST-backed lists (e.g. users).
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
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      {/* optional page header (title + create button) */}

      <DataTable.Root
        data={items}
        columns={columns}
        sorting={sorting}
        onSortingChange={setSorting}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <DataTable.FilterButton
              filterables={...}
              value={filters}
              onChange={(next) => {
                void setFilters(next);
                if (page !== 1) {
                  void setPagination({ pageIndex: 1 });
                }
              }}
            />
            <DataTable.ColumnSettings />
          </div>

          <Scrollable
            className="min-h-0 flex-1 rounded-lg border"
            shadowOffsetTop={48}
          >
            <DataTable.Content
              isLoading={isLoading || isFetching}
              error={error}
              onRetry={() => {
                void refetch();
              }}
              border
              className="border-0"
            />
          </Scrollable>

          <DataTable.Pagination
            className="shrink-0"
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
        </div>
      </DataTable.Root>
    </div>
  </ScrollableProvider>
</TooltipProvider>
```

URL keys (via nuqs):

- `sorting` — `id:asc|desc` (multi)
- `filters` — qs-encoded filter objects (multi); date ranges use `range=gte...lte`
- `page`, `perPage` — pagination (`pageIndex` / `pageSize` in the hook)

Fetch with generated options + credentials:

```tsx
const { data, isLoading, isFetching, error, refetch } = useQuery({
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

Pass `error` / `onRetry` into `DataTable.Content` so failed fetches render `QueryError` (Empty-based) instead of an empty table.

Reset `page` to `1` when filters or `perPage` change.

### 4. Create / update / delete (mutations)

Pattern (when adding write endpoints):

1. Add `POST` / `PATCH` / `DELETE` routes on the resource module.
2. Regenerate `@plank/client` (`pnpm --filter @plank/client codegen`).
3. Use `useMutation({ ...postXMutation() })` (or patch/delete equivalents) — no custom fetch hooks.
4. Build the form with **react-hook-form**; wire `handleSubmit` to the mutation.
5. On success: invalidate the list with a partial key match, toast, then navigate back — e.g. `queryClient.invalidateQueries({ queryKey: [{ _id: "getUsers" }] })` (see `create-user-page.tsx` / `create-role-page.tsx`).
6. **`*Trigger asChild` + `children` is mandatory for every overlay** — Dialog, Popover, DropdownMenu, Tooltip, Sheet, etc. — not only destructive dialogs and not only DataTable cells. Always wrap callers’ trigger UI with the matching `*Trigger asChild` inside a dedicated component (see **Compound overlays — `Trigger asChild` + `children`** and `delete-user-dialog.tsx`). Never hard-code the trigger or lift bare overlay state onto the page.

Do not put mutation logic inside `common/tables/*` — only columns and filterables live there.

### 5. Conventions

- One table schema file per admin resource under `src/common/tables/`.
- List APIs are paginated + filterable from day one.
- `DataTable` is uncontrolled for data: always pass `data` from the query result.
- Table UI state (sort / filters / page) lives in the URL via `@plank/ui/hooks` search-param hooks — not local `useState`.
- Wrap scrollable table bodies in `ScrollableProvider` + `Scrollable` so pagination can `scrollToTop`.
- Use `credentials: "include"` for authenticated API calls from the web app.
- Wire list query `error` + `refetch` into `DataTable.Content` (`error` / `onRetry`). Failed fetches render `@plank/ui/components/query-error` (`QueryError`, built on Empty). Reuse `QueryError` for other remote empty/error panels outside tables.
