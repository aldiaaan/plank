import type { GetUsersResponse } from "@plank/client";
import { PERMISSIONS } from "@plank/common";
import {
  Avatar,
  AvatarFallback,
} from "@plank/ui/components/avatar";
import { Badge } from "@plank/ui/components/badge";
import type {
  DataTableDateRangeFilterable,
  DataTableMultiSelectFilterable,
  DataTableTextFilterable,
} from "@plank/ui/components/data-table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@plank/ui/components/tooltip";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { CalendarDays, KeyRoundIcon, SearchIcon } from "lucide-react";

export type UserManagementRow =
  GetUsersResponse["result"]["items"][number];

export const userManagementFilterables: Array<
  | DataTableTextFilterable
  | DataTableMultiSelectFilterable
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
    options: PERMISSIONS.map((permission) => ({
      id: permission,
      label: permission,
    })),
  },
  {
    id: "createdAt",
    label: "Registered",
    type: "date-range",
    icon: CalendarDays,
  },
];

export const userManagementColumns: ColumnDef<UserManagementRow>[] = [
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
    id: "user",
    header: "User",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar className="size-10">
          <AvatarFallback>
            {row.original.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.email.length > 50
              ? `${row.original.email.slice(0, 50)}...`
              : row.original.email}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "permissions",
    size: 180,
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
    id: "createdAt",
    size: 160,
    enableSorting: true,
    header: "Registered",
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
