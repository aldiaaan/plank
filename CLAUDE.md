# CLAUDE.md

Guidance for AI agents working in this repo.

## CRUD data tables (web)

Server-driven tables use `@plank/ui` `DataTable` + `@plank/client` React Query options. Sorting, filtering, and pagination are **manual** — the UI only emits state; the page fetches from the API.

Persist table state in the URL with `@plank/ui/hooks` (`useSortingSearchParams`, `useFilterSearchParams`, `usePaginationSearchParams`). Requires `NuqsAdapter` in the app root (see `apps/plank-web/src/root.tsx`).

Reference implementation:

- API: `GET /users` (`packages/plank-server/src/modules/user/`)
- DB: `listUsers` (`packages/plank-db/src/queries/users.ts`)
- Columns/filters: `apps/plank-web/src/common/tables/users-management.tsx`
- Page: `apps/plank-web/src/features/dashboard/components/manage-users-page.tsx`
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
    query: { ...filtersToQuery(filters), limit: perPage, offset },
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
