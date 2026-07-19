import {
  type ColumnDef,
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  type OnChangeFn,
  type SortingState,
  type Table as TanStackTable,
  useReactTable,
} from "@tanstack/react-table";
import { useDebounce } from "@uidotdev/usehooks";
import { format } from "date-fns";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
  FilterIcon,
  RefreshCcwIcon,
  Settings2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useDataTable } from "../hooks/use-datatable";
import { cn } from "../utils";
import { Button, buttonVariants } from "./button";
import { Calendar } from "./calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollableContext } from "./scrollable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

/**
 * Compound data table built on TanStack Table.
 *
 * Sorting, filtering and pagination are **manual** (server-driven). The table
 * only renders rows and emits UI events; you own the data fetching.
 *
 * Composition:
 * ```tsx
 * <DataTable.Root data={rows} columns={columns} sorting={sorting} onSortingChange={setSorting}>
 *   <DataTable.FilterButton filterables={...} value={filters} onChange={setFilters} />
 *   <DataTable.ColumnSettings />
 *   <DataTable.Content isLoading={isLoading} border />
 *   <DataTable.Pagination page={page} totalPages={totalPages} perPage={perPage} total={total} ... />
 * </DataTable.Root>
 * ```
 *
 * @example
 * ```tsx
 * import { DataTable } from "@plank/ui/components/data-table"
 * import type { ColumnDef, SortingState } from "@tanstack/react-table"
 *
 * type User = { id: string; name: string; email: string }
 *
 * const columns: ColumnDef<User>[] = [
 *   { accessorKey: "name", header: "Name" },
 *   { accessorKey: "email", header: "Email" },
 * ]
 *
 * function UsersTable({ data, total, isLoading }: { data: User[]; total: number; isLoading?: boolean }) {
 *   const [sorting, setSorting] = useState<SortingState>([])
 *   const [page, setPage] = useState(1)
 *   const [perPage, setPerPage] = useState(20)
 *   const [filters, setFilters] = useState<DataTableFilterValue[]>([])
 *   const totalPages = Math.max(1, Math.ceil(total / perPage))
 *
 *   return (
 *     <DataTable.Root data={data} columns={columns} sorting={sorting} onSortingChange={setSorting}>
 *       <div className="flex gap-2 p-2">
 *         <DataTable.FilterButton
 *           filterables={[
 *             { id: "search", label: "Search", type: "text" },
 *             { id: "role", label: "Role", type: "multi-select", options: [
 *               { id: "admin", label: "Admin" },
 *               { id: "user", label: "User" },
 *             ]},
 *             { id: "createdAt", label: "Created", type: "date-range" },
 *           ]}
 *           value={filters}
 *           onChange={setFilters}
 *         />
 *         <DataTable.ColumnSettings />
 *       </div>
 *       <DataTable.Content isLoading={isLoading} border />
 *       <DataTable.Pagination
 *         page={page}
 *         perPage={perPage}
 *         total={total}
 *         totalPages={totalPages}
 *         onPageChange={setPage}
 *         onPerPageChange={setPerPage}
 *       />
 *     </DataTable.Root>
 *   )
 * }
 * ```
 */
export type DataTableRootProps<TData, TValue = unknown> = {
  children?: React.ReactNode;
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
};

export type DataTableContentProps = {
  className?: string;
  border?: boolean;
  isLoading?: boolean;
};

export type DataTableContextType<TData = unknown> = {
  table: TanStackTable<TData>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- compound API shares one context across generic roots
export const DataTableContext = createContext<DataTableContextType<any> | null>(
  null,
);

/**
 * Creates the TanStack table instance and provides it to children via context.
 *
 * Sorting is manual (`manualSorting: true`) — pass `sorting` and
 * `onSortingChange` and refetch on the server when they change.
 *
 * Must wrap all other `DataTable.*` parts.
 */
export function DataTableRoot<TData, TValue = unknown>(
  props: DataTableRootProps<TData, TValue>,
) {
  const { children, data, columns, sorting, onSortingChange } = props;

  const table = useReactTable({
    columns,
    data,
    manualSorting: true,
    enableMultiSort: true,
    // Treat every header click as multi-sort so sorting another column
    // appends/toggles instead of replacing the existing sort state.
    isMultiSortEvent: () => true,
    state: {
      sorting: sorting ?? [],
    },
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: (updater) => {
      if (!onSortingChange) return;
      // Resolve against controlled state so URL/nuqs setters always get a
      // concrete SortingState (TanStack passes an updater fn; nuqs' previous
      // value can be undefined before the key exists in the URL).
      onSortingChange(functionalUpdate(updater, sorting ?? []));
    },
    defaultColumn: {
      minSize: 0,
      size: 0,
    },
  });

  return (
    <DataTableContext.Provider value={{ table: table as TanStackTable<any> }}>
      {children}
    </DataTableContext.Provider>
  );
}

const MotionTableRow = motion.create(TableRow);

/**
 * Renders the table header and body.
 *
 * - `isLoading` shows skeleton placeholder rows while data is loading.
 * - `border` adds right borders to cells/headers.
 * - Renders "No results." when there are no rows and not loading.
 */
export function DataTableContent(props: DataTableContentProps) {
  const { className, border } = props;

  const { table } = useDataTable();

  const renderPlaceholder = () => {
    return Array.from({ length: 100 }).map((_, index) => (
      <AnimatePresence key={`${index}.placeholder`}>
        <MotionTableRow
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            // easeIn function
            delay: index / 100,
          }}
          key={`${index}.placeholder`}
          className="hover:bg-background"
        >
          {table.getAllColumns().map((column) => (
            <TableCell key={column.id}>
              <Skeleton
                style={{
                  width: column.getSize() || "100%",
                }}
                className="h-4 w-full bg-gray-300/50"
              />
            </TableCell>
          ))}
        </MotionTableRow>
      </AnimatePresence>
    ));
  };

  return (
    <DataTableContext.Provider value={{ table }}>
      <div className={cn(className)}>
        <Table>
          <TableHeader className="[&_tr]:border-b-0">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className={cn(
                  "border-b-0 hover:bg-background",
                  border && "[&_th]:border-r [&_th:last-child]:border-0",
                )}
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      className={cn(
                        "sticky top-0 z-20 bg-background tracking-tight select-none shadow-[inset_0_-1px_0_0_var(--border)]",
                        canSort && "cursor-pointer",
                      )}
                      key={header.id}
                      style={{
                        width:
                          header.getSize() !== 0 ? header.getSize() : undefined,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        {{
                          asc: <ArrowUpIcon className="size-4" />,
                          desc: <ArrowDownIcon className="size-4" />,
                        }[header.column.getIsSorted() as string] ??
                          (canSort ? (
                            <ArrowUpDownIcon className="size-4" />
                          ) : null)}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <AnimatePresence key={`${row.id}.${index}`}>
                  <MotionTableRow
                    data-row-id={row.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      // easeIn function
                      delay: index / 50,
                    }}
                    key={`${row.id}.${index}`}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(row.id === "select" && "pl-0")}
                  >
                    {row.getVisibleCells().map((cell, index) => (
                      <TableCell
                        className={cn(
                          border && "border-r",
                          index === row.getVisibleCells().length - 1 &&
                            "border-r-0",
                          "text-foreground/90 ",
                        )}
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </MotionTableRow>
                </AnimatePresence>
              ))
            ) : props.isLoading ? (
              renderPlaceholder()
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DataTableContext.Provider>
  );
}

export type DataTableColumnSettingsProps = {
  className?: string;
};

/**
 * Dropdown for showing/hiding columns and resetting column visibility.
 *
 * Reads the table instance from context, so it must be rendered inside
 * `DataTable.Root`.
 */
export function DataTableColumnSettings(props: DataTableColumnSettingsProps) {
  const { className } = props;

  const { table } = useDataTable();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("px-2 text-foreground/75", className)}
        >
          <Settings2 />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            if (
              searchQuery &&
              !column.id.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
              return null;
            }

            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            table.resetColumnVisibility();
            setSearchQuery("");
          }}
        >
          <RefreshCcwIcon /> Reset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type DataTablePaginationProps = {
  className?: string;
  total?: number;
  totalPages?: number;
  perPage?: number;
  page: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
};

/**
 * External pagination controls (first/prev/next/last + rows-per-page select).
 *
 * Pagination is server-driven: this component only emits `onPageChange` and
 * `onPerPageChange`. Scrolls the table back to the top on page change.
 *
 * Renders `null` if `totalPages` or `perPage` are not provided.
 */
export function DataTablePagination(props: DataTablePaginationProps) {
  const {
    className,
    totalPages,
    page,
    perPage,
    onPageChange,
    onPerPageChange,
    total,
  } = props;

  const scrollable = useContext(ScrollableContext);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      onPageChange?.(nextPage);
      scrollable?.scrollToTop();
    },
    [onPageChange, scrollable],
  );

  const isReady = totalPages && perPage;

  if (!isReady) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center border-t justify-between px-2.5 py-1.5",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <p className="text-sm text-foreground/75">
          <span className="font-medium text-foreground">
            {(page - 1) * perPage + 1}
          </span>{" "}
          -{" "}
          <span className="font-medium text-foreground">
            {Math.min(page * perPage, total || Number.MAX_SAFE_INTEGER)}
          </span>{" "}
          of <span className="font-medium text-foreground">{total}</span>
        </p>
        <Separator
          orientation="vertical"
          className="mx-1 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2">
          <p className="text-sm text-foreground/75">Rows per page</p>
          <Select
            value={perPage.toString()}
            onValueChange={(value) => onPerPageChange?.(Number(value))}
          >
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
            <SelectTrigger className="text-xs px-2 h-2" size="sm">
              <SelectValue
                className="font-medium"
                placeholder="Select a page size"
              />
            </SelectTrigger>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => handlePageChange(1)}
          disabled={page === 1}
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => handlePageChange(Math.max(page - 1, 1))}
          disabled={page === 1}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>
        <p className="text-sm text-foreground/75">
          {page} / {totalPages}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => {
            handlePageChange(Math.min(page + 1, totalPages));
          }}
          disabled={totalPages === page}
        >
          <ChevronRightIcon className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => handlePageChange(totalPages)}
          disabled={page === totalPages}
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export type DataTableFilterable = {
  id: string;
  label: string;
  icon?: React.ElementType;
};

export type DataTableDateRangeFilterable = DataTableFilterable & {
  type: "date-range";
};

export type DataTableMultiSelectFilterable = DataTableFilterable & {
  type: "multi-select";
  options: Array<{
    id: string;
    label: string;
  }>;
};

export type DataTableSelectFilterable = DataTableFilterable & {
  type: "select";
  options: Array<{
    id: string;
    label: string;
  }>;
};

export type DataTableTextFilterable = DataTableFilterable & {
  type: "text";
};

export type DataTableFilterItemValue =
  | {
      gte?: string | number;
      lte?: string | number;
      in?: (string | number | null)[];
      eq?: string | number;
    }
  | undefined;

export type DataTableFilterValue = {
  id: string;
  value: DataTableFilterItemValue;
};

function DataTableFilterRemoveButton({ onDelete }: { onDelete?: () => void }) {
  if (!onDelete) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      aria-label="Remove filter"
      className="shrink-0 rounded-l-none border-l-0 px-0"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete();
      }}
    >
      <X className="size-3.5" />
    </Button>
  );
}

export type DataTableDateFilterButtonProps = {
  children?: React.ReactNode;
  onDelete?: () => void;
  onChange: (value: DataTableFilterItemValue) => void;
  id: string;
  icon?: React.ElementType;
  gte?: string | number;
  lte?: string | number;
};

function DataTableDateFilterButton(props: DataTableDateFilterButtonProps) {
  const { gte, lte, onDelete, onChange, children } = props;

  const [open, setOpen] = useState(false);

  const [from, setFrom] = useState<Date | undefined>(
    gte ? new Date(gte as string) : undefined,
  );
  const [to, setTo] = useState<Date | undefined>(
    lte ? new Date(lte as string) : undefined,
  );

  const range = useMemo(() => {
    return {
      from,
      to,
    };
  }, [from, to]);

  const debouncedRange = useDebounce(range, 1000);

  useEffect(() => {
    if (debouncedRange.from && debouncedRange.to) {
      onChange({
        gte: format(debouncedRange.from, "yyyy-MM-dd"),
        lte: format(debouncedRange.to, "yyyy-MM-dd"),
      });
    }
  }, [debouncedRange, onChange]);

  useEffect(() => {
    if (!from && !to) {
      setOpen(true);
    }
  }, []);

  const renderValue = useCallback((value?: { from?: Date; to?: Date }) => {
    if (value?.from && value?.to) {
      return (
        <>{`${format(value.from, "dd MMMM, yyyy")} - ${format(
          value.to,
          "dd MMMM, yyyy",
        )}`}</>
      );
    }
    return "";
  }, []);

  const handlePopoverOpenChange = (v: boolean) => {
    setOpen(v);
  };

  return (
    <div className="flex items-stretch">
      <Popover modal open={open} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("px-2 cursor-pointer", onDelete && "rounded-r-none")}
          >
            {children}
            {from || to ? (
              <>
                <Separator orientation="vertical" />
                {renderValue({ from, to })}
              </>
            ) : (
              <>
                <Separator orientation="vertical" />
                <p className="text-muted-foreground/50">
                  {(from || to) && open
                    ? "Select a date range"
                    : "Click to select date range"}
                </p>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          // onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-auto p-0"
        >
          <Calendar
            mode="range"
            numberOfMonths={2}
            selected={{
              from: from ? new Date(from) : undefined,
              to: to ? new Date(to) : undefined,
            }}
            onSelect={(value) => {
              if (!value) return;
              // range always has from and to defined, so we don't need to check for undefined
              if (!value.from || !value.to) return;
              setFrom(value.from);
              setTo(value.to);
              // onChange({
              //   gte: format(value.from, 'yyyy-MM-dd'),
              //   lte: format(value.to, 'yyyy-MM-dd'),
              //   in: [],
              // });
            }}
          />
        </PopoverContent>
      </Popover>
      <DataTableFilterRemoveButton onDelete={onDelete} />
    </div>
  );
}

export type DataTableSelectFilterButtonProps = {
  value?: Array<string | number>;
  onChange?: (value: DataTableFilterItemValue) => void;
  options: Array<DataTableSelectFilterable["options"][number]>;
  onDelete?: () => void;
  children?: React.ReactNode;
  /** When false, only one option can be selected and the value is stored as `eq`. */
  multiple?: boolean;
};

function DataTableSelectFilterButton(props: DataTableSelectFilterButtonProps) {
  const {
    value,
    onChange,
    options,
    onDelete,
    children,
    multiple = true,
  } = props;

  const [open, setOpen] = useState(false);
  const showSearch = multiple || options.length > 5;

  useEffect(() => {
    setOpen(true);
  }, []);

  const handlePopoverOpenChange = (v: boolean) => {
    if (!value || value.length === 0) {
      onDelete?.();
    }
    setOpen(v);
  };

  const selectedLabels = (value ?? [])
    .map(
      (id) =>
        options.find((option) => String(option.id) === String(id))?.label ??
        String(id),
    )
    .join(", ");

  return (
    <div className="flex items-stretch">
      <Popover modal open={open} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("px-2 cursor-pointer", onDelete && "rounded-r-none")}
          >
            {children}

            {value && value.length > 0 ? (
              <>
                <Separator orientation="vertical" />
                <span className="font-normal">{selectedLabels}</span>
              </>
            ) : (
              <>
                <Separator orientation="vertical" />
                <p className="font-normal text-muted-foreground/50">
                  {multiple ? "Select options" : "Select option"}
                </p>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto min-w-40 gap-0 p-0"
          side="bottom"
          align="start"
          sideOffset={6}
        >
          <Command className="size-auto rounded-2xl">
            {showSearch ? (
              <CommandInput placeholder="Search..." />
            ) : null}
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const selected = value?.some(
                    (item) => String(item) === String(option.id),
                  );
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.label}
                      onSelect={() => {
                        if (multiple) {
                          if (selected) {
                            onChange?.({
                              in: value?.filter(
                                (item) => String(item) !== String(option.id),
                              ),
                            });
                          } else {
                            onChange?.({
                              in: value
                                ? [...value, option.id]
                                : [option.id],
                            });
                          }
                          return;
                        }

                        if (selected) {
                          onChange?.({ eq: undefined });
                        } else {
                          onChange?.({ eq: option.id });
                          setOpen(false);
                        }
                      }}
                    >
                      {option.label}
                      {selected ? (
                        <CheckIcon className="ml-auto size-4" />
                      ) : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DataTableFilterRemoveButton onDelete={onDelete} />
    </div>
  );
}

function DataTableTextFilterButton(
  props: DataTableTextFilterable & {
    value?: string | number;
    onChange: (value?: string | number) => void;
    onDelete?: () => void;
    children?: React.ReactNode;
  },
) {
  const { value, onChange, children, onDelete } = props;

  const [text, setText] = useState(value?.toString() ?? "");
  const debouncedText = useDebounce(text, 1000);
  const ref = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const current = value?.toString() ?? "";
    if (debouncedText === current) return;
    onChangeRef.current?.(debouncedText);
  }, [debouncedText, value]);

  useEffect(() => {
    if (ref.current) {
      setTimeout(() => {
        ref.current?.focus();
      }, 100);
    }
  }, []);

  return (
    <div className="flex items-stretch">
      <div
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          onDelete && "rounded-r-none",
        )}
      >
        {children}
        <Separator orientation="vertical" />
        <Input
          ref={ref}
          placeholder="Search..."
          className="outline-none w-40 p-0 py-0.5 border-none focus-visible:ring-0 text-sm focus-visible:ring-offset-0"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <DataTableFilterRemoveButton onDelete={onDelete} />
    </div>
  );
}

export type DataTableFilterOnChangeFn = (
  value: Array<{ id: string; value: DataTableFilterItemValue }>,
) => void;

export type DataTableFilterButtonProps = {
  filterables?: Array<
    | DataTableDateRangeFilterable
    | DataTableMultiSelectFilterable
    | DataTableSelectFilterable
    | DataTableTextFilterable
  >;
  value: Array<DataTableFilterValue>;
  onChange: DataTableFilterOnChangeFn;
};

/**
 * Filter button that renders a dropdown of available filters and the active
 * filter chips below it.
 *
 * Filtering is external — this component only manages UI state via
 * `value` / `onChange`. Apply the emitted values on the server when refetching.
 *
 * Filter value shape:
 * ```ts
 * type DataTableFilterItemValue = {
 *   gte?: string | number   // date-range from
 *   lte?: string | number   // date-range to
 *   in?: (string | number | null)[]  // select / multi-select
 *   eq?: string | number    // text
 * } | undefined
 * ```
 *
 * Filterable types: `"text"` | `"select"` | `"multi-select"` | `"date-range"`.
 */
export function DataTableFilterButton(props: DataTableFilterButtonProps) {
  const { filterables = [], value, onChange } = props;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "px-2 text-foreground/75",
              value.length > 0 &&
                "bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground/90",
            )}
          >
            <FilterIcon />
            Filter
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="w-56"
          align="start"
        >
          {filterables.map((filterable) => {
            switch (filterable.type) {
              case "date-range":
                return (
                  <DropdownMenuItem
                    key={filterable.id}
                    onClick={() => {
                      if (!value.some((item) => item.id === filterable.id)) {
                        onChange([
                          ...value,
                          {
                            id: filterable.id,
                            value: {
                              gte: undefined,
                              lte: undefined,
                              in: [],
                            },
                          },
                        ]);
                      }
                    }}
                  >
                    {filterable.icon && <filterable.icon className="size-4" />}
                    {filterable.label}
                  </DropdownMenuItem>
                );
              case "text":
                return (
                  <DropdownMenuItem
                    key={filterable.id}
                    onClick={() => {
                      if (!value.some((item) => item.id === filterable.id)) {
                        onChange([
                          ...value,
                          {
                            id: filterable.id,
                            value: {
                              eq: undefined,
                            },
                          },
                        ]);
                      }
                    }}
                  >
                    {filterable.icon && <filterable.icon className="size-4" />}
                    {filterable.label}
                  </DropdownMenuItem>
                );
              case "multi-select":
                return (
                  <DropdownMenuItem
                    key={filterable.id}
                    onClick={() => {
                      if (!value.some((item) => item.id === filterable.id)) {
                        onChange([
                          ...value,
                          {
                            id: filterable.id,
                            value: {
                              in: [],
                            },
                          },
                        ]);
                      }
                    }}
                  >
                    {filterable.icon && <filterable.icon className="size-4" />}
                    {filterable.label}
                  </DropdownMenuItem>
                );
              case "select":
                return (
                  <DropdownMenuItem
                    key={filterable.id}
                    onClick={() => {
                      if (!value.some((item) => item.id === filterable.id)) {
                        onChange([
                          ...value,
                          {
                            id: filterable.id,
                            value: {
                              eq: undefined,
                            },
                          },
                        ]);
                      }
                    }}
                  >
                    {filterable.icon && <filterable.icon className="size-4" />}
                    {filterable.label}
                  </DropdownMenuItem>
                );
              default:
                return null;
            }
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      {value.map((v) => {
        const filter = filterables.find((item) => item.id === v.id);

        if (!filter) {
          return null;
        }

        const itemValue = value.find((item) => item.id === filter.id)?.value;

        switch (filter.type) {
          case "date-range":
            return (
              <DataTableDateFilterButton
                key={filter.id}
                id={filter.id}
                gte={itemValue?.gte}
                lte={itemValue?.lte}
                onChange={(newValue) => {
                  if (!newValue) return;

                  const currentItem = value.find(
                    (item) => item.id === filter.id,
                  );

                  if (
                    currentItem?.value?.gte === newValue.gte &&
                    currentItem?.value?.lte === newValue.lte
                  ) {
                    return;
                  }
                  onChange(
                    value.map((item) => {
                      if (item.id === filter.id) {
                        return { id: filter.id, value: newValue };
                      }
                      return item;
                    }),
                  );
                }}
                onDelete={() => {
                  onChange(value.filter((item) => item.id !== filter.id));
                }}
              >
                {filter.icon && <filter.icon className="size-4" />}
                {filter.label}
              </DataTableDateFilterButton>
            );
          case "multi-select":
            return (
              <DataTableSelectFilterButton
                key={filter.id}
                multiple
                value={
                  itemValue?.in?.filter(
                    (item): item is string | number => item !== null,
                  ) ?? []
                }
                onChange={(newValue) => {
                  onChange(
                    value.map((item) => {
                      if (item.id === filter.id) {
                        return { id: filter.id, value: newValue };
                      }
                      return item;
                    }),
                  );
                }}
                options={filter.options}
                onDelete={() => {
                  onChange(value.filter((item) => item.id !== filter.id));
                }}
              >
                {filter.icon && <filter.icon className="size-4" />}
                {filter.label}
              </DataTableSelectFilterButton>
            );
          case "select":
            return (
              <DataTableSelectFilterButton
                key={filter.id}
                multiple={false}
                value={
                  itemValue?.eq !== undefined && itemValue?.eq !== ""
                    ? [itemValue.eq]
                    : []
                }
                onChange={(newValue) => {
                  onChange(
                    value.map((item) => {
                      if (item.id === filter.id) {
                        return { id: filter.id, value: newValue };
                      }
                      return item;
                    }),
                  );
                }}
                options={filter.options}
                onDelete={() => {
                  onChange(value.filter((item) => item.id !== filter.id));
                }}
              >
                {filter.icon && <filter.icon className="size-4" />}
                {filter.label}
              </DataTableSelectFilterButton>
            );
          case "text":
            return (
              <DataTableTextFilterButton
                key={filter.id}
                type={filter.type}
                label={filter.label}
                id={filter.id}
                onDelete={() => {
                  onChange(value.filter((item) => item.id !== filter.id));
                }}
                onChange={(newValue) => {
                  const currentItem = value.find(
                    (item) => item.id === filter.id,
                  );
                  if (currentItem?.value?.eq === newValue) return;

                  onChange(
                    value.map((item) => {
                      if (item.id === filter.id) {
                        return { id: filter.id, value: { eq: newValue } };
                      }
                      return item;
                    }),
                  );
                }}
                value={itemValue?.eq}
              >
                {filter.icon && <filter.icon className="size-4" />}
                {filter.label}
              </DataTableTextFilterButton>
            );
          default:
            return null;
        }
      })}
    </>
  );
}

/**
 * Compound data table namespace. See {@link DataTableRoot} for full usage docs.
 *
 * Parts:
 * - `DataTable.Root` — creates the table instance + context.
 * - `DataTable.Content` — renders header/body.
 * - `DataTable.FilterButton` — adds filter chips.
 * - `DataTable.DateFilterButton` — standalone date-range filter chip.
 * - `DataTable.Pagination` — external page controls.
 * - `DataTable.ColumnSettings` — show/hide columns dropdown.
 */
export const DataTable = {
  Root: DataTableRoot,
  Content: DataTableContent,
  FilterButton: DataTableFilterButton,
  DateFilterButton: DataTableDateFilterButton,
  // SelectFilterButton: DataTableSelectFilterButton,
  Pagination: DataTablePagination,
  ColumnSettings: DataTableColumnSettings,
};
