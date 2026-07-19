import { getUsers, type GetSessionsResponse } from "@plank/client";
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
import { format, formatDistanceToNow, isPast } from "date-fns";
import {
  CalendarClock,
  CalendarDays,
  SearchIcon,
  UsersIcon,
} from "lucide-react";

export type SessionManagementRow =
  GetSessionsResponse["result"]["items"][number];

export const sessionManagementFilterables: Array<
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
    id: "userIds",
    label: "Users",
    type: "multi-select",
    icon: UsersIcon,
    loadOptions: async ({ search }) => {
      const { data } = await getUsers({
        query: {
          search: search.length > 0 ? search : undefined,
          limit: 20,
        },
        credentials: "include",
      });

      return (
        data?.result.items.map((user) => ({
          id: user.id,
          label: `${user.name} (${user.email})`,
        })) ?? []
      );
    },
  },
  {
    id: "createdAt",
    label: "Created",
    type: "date-range",
    icon: CalendarDays,
  },
  {
    id: "expiresAt",
    label: "Expires",
    type: "date-range",
    icon: CalendarClock,
  },
];

export const sessionManagementColumns: ColumnDef<SessionManagementRow>[] = [
  {
    id: "id",
    size: 120,
    header: "Session",
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
            {row.original.userName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{row.original.userName}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.userEmail.length > 50
              ? `${row.original.userEmail.slice(0, 50)}...`
              : row.original.userEmail}
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "status",
    size: 120,
    header: "Status",
    cell: ({ row }) => {
      const expired = isPast(new Date(row.original.expiresAt));
      return (
        <Badge variant={expired ? "outline" : "default"}>
          {expired ? "Expired" : "Active"}
        </Badge>
      );
    },
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
  {
    id: "expiresAt",
    size: 160,
    enableSorting: true,
    header: "Expires",
    accessorKey: "expiresAt",
    cell: ({ row }) => {
      const expiresAt = new Date(row.original.expiresAt);
      const relativeTime = formatDistanceToNow(expiresAt, { addSuffix: true });
      const formattedDate = format(expiresAt, "PPpp");

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
