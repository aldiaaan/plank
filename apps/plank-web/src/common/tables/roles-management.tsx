import type { GetRolesResponse } from "@plank/client";
import { Badge } from "@plank/ui/components/badge";
import type {
  DataTableDateRangeFilterable,
  DataTableMultiSelectFilterable,
  DataTableSelectFilterable,
  DataTableTextFilterable,
} from "@plank/ui/components/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@plank/ui/components/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import {
  CalendarDays,
  KeyRoundIcon,
  SearchIcon,
  ShieldIcon,
} from "lucide-react";

export type RoleManagementRow = GetRolesResponse["result"]["items"][number];

export const roleManagementFilterables: Array<
  | DataTableTextFilterable
  | DataTableMultiSelectFilterable
  | DataTableSelectFilterable
  | DataTableDateRangeFilterable
> = [
  {
    id: "search",
    label: "Search",
    type: "text",
    icon: SearchIcon,
  },
  {
    id: "permissions",
    label: "Permissions",
    type: "multi-select",
    icon: KeyRoundIcon,
    options: [
      { id: "read:all", label: "read:all" },
      { id: "write:all", label: "write:all" },
    ],
  },
  {
    id: "isSystem",
    label: "Type",
    type: "select",
    icon: ShieldIcon,
    options: [
      { id: "true", label: "System" },
      { id: "false", label: "Custom" },
    ],
  },
  {
    id: "createdAt",
    label: "Created",
    type: "date-range",
    icon: CalendarDays,
  },
];

function formatRoleLabel(name: string) {
  return name
    .split(/[_-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const roleManagementColumns: ColumnDef<RoleManagementRow>[] = [
  {
    id: "id",
    size: 100,
    header: "ID",
    cell: ({ row }) => (
      <p className="text-sm font-medium tracking-tight text-muted-foreground">
        #{row.original.id.slice(0, 8)}
      </p>
    ),
  },
  {
    id: "name",
    enableSorting: true,
    header: "Role",
    accessorKey: "name",
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">
          {formatRoleLabel(row.original.name)}
        </p>
        {row.original.description ? (
          <p className="text-xs text-muted-foreground">
            {row.original.description.length > 60
              ? `${row.original.description.slice(0, 60)}...`
              : row.original.description}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No description</p>
        )}
      </div>
    ),
  },
  {
    id: "permissions",
    size: 200,
    header: "Permissions",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.permissions.length === 0 ? (
          <Badge variant="outline">None</Badge>
        ) : (
          row.original.permissions.map((permission) => (
            <Badge key={`${row.original.id}-${permission}`} variant="outline">
              {permission}
            </Badge>
          ))
        )}
      </div>
    ),
  },
  {
    id: "isSystem",
    size: 120,
    header: "Type",
    cell: ({ row }) => (
      <Badge variant={row.original.isSystem ? "default" : "outline"}>
        {row.original.isSystem ? "System" : "Custom"}
      </Badge>
    ),
  },
  {
    id: "createdAt",
    size: 160,
    enableSorting: true,
    header: "Created",
    accessorKey: "createdAt",
    cell: ({ row }) => {
      const createdAt = new Date(row.original.createdAt);
      const relativeTime = formatDistanceToNow(createdAt, { addSuffix: true });
      const formattedDate = format(createdAt, "PPpp");

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="cursor-help text-sm font-medium tracking-tight text-muted-foreground">
              {relativeTime}
            </p>
          </TooltipTrigger>
          <TooltipContent>
            <p>{formattedDate}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
];
