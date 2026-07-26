import { getUsersOptions } from "@plank/client";
import { Button } from "@plank/ui/components/button";
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
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";
import { Link, useOutletContext } from "react-router";
import {
  type UserManagementRow,
  userManagementColumns,
  userManagementFilterables,
} from "../../../common/tables/users-management";
import { UserRowActions } from "./user-row-actions";
import type { Route } from "./+types/manage-users-page";
export const meta: Route.MetaFunction = () => [
  { title: "Manage Users | Plank" },
  {
    name: "description",
    content: "Search and filter users by permissions and registration date.",
  },
];

type DashboardOutletContext = {
  user: {
    id: string;
    email: string;
    name: string;
  };
};

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

function createColumns(
  currentUserId: string,
): ColumnDef<UserManagementRow>[] {
  return [
    ...userManagementColumns,
    {
      id: "actions",
      size: 72,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <UserRowActions
          userId={row.original.id}
          userName={row.original.name}
          canDelete={row.original.id !== currentUserId}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${row.original.name}`}
          >
            <MoreHorizontalIcon />
          </Button>
        </UserRowActions>
      ),
    },
  ];
}

export default function ManageUsersPage() {
  const { user } = useOutletContext<DashboardOutletContext>();
  const [sorting, setSorting] = useSortingSearchParams();
  const [filters, setFilters] = useFilterSearchParams();
  const [{ pageIndex: page, pageSize: perPage }, setPagination] =
    usePaginationSearchParams();

  const queryFilters = filtersToQuery(filters);
  const offset = (page - 1) * perPage;
  const columns = createColumns(user.id);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    ...getUsersOptions({
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
          <div className="flex shrink-0 items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-semibold font-heading tracking-tight">
                Manage Users
              </h1>
              <p className="text-sm text-muted-foreground">
                Search and filter users by permissions and registration date.
              </p>
            </div>
            <div>
              <Button asChild>
                <Link to="/dashboard/users/create" viewTransition>
                  Create User
                </Link>
              </Button>
            </div>
          </div>

          <DataTable.Root
            data={items}
            columns={columns}
            sorting={sorting}
            onSortingChange={setSorting}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
              <div className="flex shrink-0 flex-wrap items-center gap-2">
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
