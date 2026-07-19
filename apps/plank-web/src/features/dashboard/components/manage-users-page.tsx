import { getUsersOptions } from "@plank/client";
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
  userManagementColumns,
  userManagementFilterables,
} from "../../../common/tables/users-management";

function filtersToQuery(filters: DataTableFilterValue[]) {
  const search = filters.find((filter) => filter.id === "search")?.value?.eq;
  const permissions = filters
    .find((filter) => filter.id === "permissions")
    ?.value?.in?.filter(
      (value): value is "read:all" | "write:all" =>
        value === "read:all" || value === "write:all",
    );
  const createdAt = filters.find((filter) => filter.id === "createdAt")?.value;

  return {
    search:
      typeof search === "string" && search.length > 0 ? search : undefined,
    permissions: permissions?.length ? permissions : undefined,
    createdAtGte:
      typeof createdAt?.gte === "string" ? createdAt.gte : undefined,
    createdAtLte:
      typeof createdAt?.lte === "string" ? createdAt.lte : undefined,
  };
}

export default function ManageUsersPage() {
  const [sorting, setSorting] = useSortingSearchParams();
  const [filters, setFilters] = useFilterSearchParams();
  const [{ pageIndex: page, pageSize: perPage }, setPagination] =
    usePaginationSearchParams();

  const queryFilters = filtersToQuery(filters);
  const offset = (page - 1) * perPage;

  const { data, isLoading, isFetching } = useQuery({
    ...getUsersOptions({
      query: {
        ...queryFilters,
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
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div>
            <h1 className="text-xl font-semibold font-heading tracking-tight">
              Manage Users
            </h1>
            <p className="text-sm text-muted-foreground">
              Search and filter users by permissions and registration date.
            </p>
          </div>

          <DataTable.Root
            data={items}
            columns={userManagementColumns}
            sorting={sorting}
            onSortingChange={setSorting}
          >
            <div className="flex flex-wrap items-center gap-2">
              <DataTable.FilterButton
                filterables={userManagementFilterables}
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

            <Scrollable className="min-h-0 flex-1 rounded-lg border">
              <DataTable.Content
                isLoading={isLoading || isFetching}
                border
                className="border-0"
              />
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
        </div>
      </ScrollableProvider>
    </TooltipProvider>
  );
}
