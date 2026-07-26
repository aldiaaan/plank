import { getSessionsOptions } from "@plank/client";
import {
  DataTable,
  type DataTableFilterValue,
} from "@plank/ui/components/data-table";
import {
  Scrollable,
  ScrollableProvider,
} from "@plank/ui/components/scrollable";
import { TooltipProvider } from "@plank/ui/components/tooltip";
import {
  useFilterSearchParams,
  usePaginationSearchParams,
  useSortingSearchParams,
} from "@plank/ui/hooks";
import { useQuery } from "@tanstack/react-query";
import {
  sessionManagementColumns,
  sessionManagementFilterables,
} from "../../../../common/tables/sessions-management";
import type { Route } from "./+types/manage-sessions-page";

export const meta: Route.MetaFunction = () => [
  { title: "Manage Sessions | Plank" },
  {
    name: "description",
    content: "Search and filter active user sessions.",
  },
];

function filtersToQuery(filters: DataTableFilterValue[]) {
  const search = filters.find((filter) => filter.id === "search")?.value?.eq;
  const userIds = filters
    .find((filter) => filter.id === "userIds")
    ?.value?.in?.filter((id): id is string => typeof id === "string");
  const createdAt = filters.find((filter) => filter.id === "createdAt")?.value;
  const expiresAt = filters.find((filter) => filter.id === "expiresAt")?.value;

  return {
    search:
      typeof search === "string" && search.length > 0 ? search : undefined,
    userIds: userIds && userIds.length > 0 ? userIds : undefined,
    createdAtGte:
      typeof createdAt?.gte === "string" ? createdAt.gte : undefined,
    createdAtLte:
      typeof createdAt?.lte === "string" ? createdAt.lte : undefined,
    expiresAtGte:
      typeof expiresAt?.gte === "string" ? expiresAt.gte : undefined,
    expiresAtLte:
      typeof expiresAt?.lte === "string" ? expiresAt.lte : undefined,
  };
}

export default function ManageSessionsPage() {
  const [sorting, setSorting] = useSortingSearchParams();
  const [filters, setFilters] = useFilterSearchParams();
  const [{ pageIndex: page, pageSize: perPage }, setPagination] =
    usePaginationSearchParams();

  const queryFilters = filtersToQuery(filters);
  const offset = (page - 1) * perPage;

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    ...getSessionsOptions({
      query: {
        ...queryFilters,
        sorting: sorting.length > 0 ? sorting : undefined,
        limit: perPage,
        offset,
      },
      credentials: "include",
    }),
  });

  const items = data?.result.items ?? [];
  const total = data?.result.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <TooltipProvider>
      <ScrollableProvider>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="shrink-0">
            <h1 className="text-xl font-semibold font-heading tracking-tight">
              Manage Sessions
            </h1>
            <p className="text-sm text-muted-foreground">
              Search and filter active and expired user sessions.
            </p>
          </div>

          <DataTable.Root
            data={items}
            columns={sessionManagementColumns}
            sorting={sorting}
            onSortingChange={setSorting}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <DataTable.FilterButton
                  filterables={sessionManagementFilterables}
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
  );
}
