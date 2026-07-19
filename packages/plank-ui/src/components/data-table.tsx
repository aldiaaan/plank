import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type SortingState,
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
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "../../utils/react";
import { Button, buttonVariants } from "../button";
import { Calendar } from "../calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { useScrollable } from "../scrollable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";
import { Separator } from "../separator";
import { Skeleton } from "../skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";
import { useDataTable } from "./use-datatable";

export type DataTableRootProps<TData, TValue> = {
  children?: React.ReactNode;
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  className?: string;
  border?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
};

export type DataTableContentProps<TData, TValue> = {
  children?: React.ReactNode;
  className?: string;
  border?: boolean;
  isLoading?: boolean;
};


export type DataTableContextType = {
  table: Table<any>;
};

export const DataTableContext = createContext<DataTableContextType>(
  null as any,
);

export function DataTableRoot<TData, TValue>(
  props: DataTableRootProps<TData, TValue>,
) {
  const {
    children,
    data,
    columns,
    className,
    border,
    onSortingChange,
    sorting,
  } = props;

  const table = useReactTable({
    columns: columns,
    // manualSorting: true,
    manualSorting: true,
    data: data,
    state: {
      sorting: sorting || [],
    },
    enableMultiSort: true,
    // getSortedRowModel: getSortedRowModel(),
    // getRowId: (row) => {
    //   // @ts-ignore
    //   // dont forget to get id column
    //   return row.id;
    // },
    isMultiSortEvent: () => true,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: props.onSortingChange,
    defaultColumn: {
      minSize: 0,
      size: 0,
    },
  });

  return (
    <DataTableContext.Provider value={{ table }}>
      {children}
    </DataTableContext.Provider>
  );
}

const MotionTableRow = motion.create(TableRow);

export function DataTableContent<TData, TValue>(
  props: DataTableContentProps<TData, TValue>,
) {
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
      <div className={cn("border", className)}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className={cn(
                  border && "[&_th]:border-r [&_th:last-child]:border-0",
                )}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        "sticky top-0 z-20 bg-background tracking-tight select-none",
                        header.column.getCanSort() && "cursor-pointer",
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
                          (header.column.getCanSort() ? (
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
  children?: React.ReactNode;
  className?: string;
};

export function DataTableColumnSettings(props: DataTableColumnSettingsProps) {
  const { children, className } = props;

  const { table } = useDataTable();
  const [searchQuery, setSearchQuery] = useState<string>("");

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
  children?: React.ReactNode;
  className?: string;
  total?: number;
  totalPages?: number;
  perPage?: number;
  page: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
};

export function DataTablePagination(props: DataTablePaginationProps) {
  const {
    children,
    className,
    totalPages,
    page,
    perPage,
    onPageChange,
    onPerPageChange,
    total,
  } = props;

  const { table } = useDataTable();

  const { scrollToTop } = useScrollable();

  const handlePageChange = useCallback(
    (page: number) => {
      onPageChange?.(page);
      scrollToTop();
    },
    [onPageChange, scrollToTop],
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
          <span className="font-medium text-foregverround">
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

function DataTableDateFilterButton(
  props: DataTableFilterItemValue & {
    children?: React.ReactNode;
    onDelete?: () => void;
    onChange: (value: DataTableFilterItemValue) => void;
    id: string;
    icon?: React.ElementType;
  },
) {
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
    <Popover modal open={open} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="px-2 cursor-pointer">
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
          <Separator orientation="vertical" />
          <span
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <X />
          </span>
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
  );
}

export type DataTableSelectFilterButtonProps = {
  value?: Array<string | number>;
  onChange?: (value: DataTableFilterItemValue) => void;
  options: Array<DataTableSelectFilterable["options"][number]>;
  onDelete?: () => void;
  children?: React.ReactNode;
};

function DataTableSelectFilterButton(props: DataTableSelectFilterButtonProps) {
  const { value, onChange, options, onDelete, children } = props;

  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(true);
  }, []);

  const handlePopoverOpenChange = (v: boolean) => {
    if (!value || value.length === 0) {
      onDelete?.();
    }
    setOpen(v);
  };

  return (
    <div className="flex items-center space-x-4">
      <Popover modal open={open} onOpenChange={handlePopoverOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="px-2 cursor-pointer">
            {children}

            {value && value.length > 0 ? (
              <>
                <Separator orientation="vertical" />
                {value.join(", ")}
              </>
            ) : (
              <>
                <Separator orientation="vertical" />
                <p className="text-muted-foreground/50">
                  Click to select options
                </p>
              </>
            )}
            {onDelete && (
              <>
                <Separator orientation="vertical" />
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                  }}
                >
                  <X />
                </span>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" side="bottom" align="center">
          <Command>
            <CommandInput placeholder="Change status..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {options.map((status) => (
                  <CommandItem
                    key={status.id}
                    value={status.id}
                    onSelect={(newValue) => {
                      if (value?.includes(newValue)) {
                        onChange?.({
                          in: value?.filter((item) => item !== newValue),
                        });
                      } else {
                        onChange?.({
                          in: value ? [...value, newValue] : [newValue],
                        });
                      }
                    }}
                  >
                    {status.label}
                    {value?.includes(status.id) && (
                      <CheckIcon className="size-4 ml-auto" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
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

  const [text, setText] = useState(value);

  const debouncedSetText = useDebounce(text, 1000);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onChange?.(text);
  }, [debouncedSetText]);

  useEffect(() => {
    if (ref.current) {
      setTimeout(() => {
        ref.current?.focus();
      }, 100);
    }
  }, []);

  return (
    <div className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
      {children}
      <Separator orientation="vertical" />
      <Input
        ref={ref}
        placeholder="Search..."
        className="outline-none w-40 p-0 py-0.5 border-none focus-visible:ring-0 text-sm focus-visible:ring-offset-0"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Separator orientation="vertical" />
      <span
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.();
        }}
      >
        <X />
      </span>
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
            }
            return null;
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
                value={
                  itemValue?.in?.filter((item) => item !== null) as Array<
                    string | number
                  >
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
                type={filter.type}
                label={filter.label}
                id={filter.id}
                onDelete={() => {
                  onChange(value.filter((item) => item.id !== filter.id));
                }}
                onChange={(newValue) => {
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
        }
      })}
    </>
  );
}

export const DataTable = {
  Root: DataTableRoot,
  Content: DataTableContent,
  FilterButton: DataTableFilterButton,
  DateFilterButton: DataTableDateFilterButton,
  // SelectFilterButton: DataTableSelectFilterButton,
  Pagination: DataTablePagination,
  ColumnSettings: DataTableColumnSettings,
};
