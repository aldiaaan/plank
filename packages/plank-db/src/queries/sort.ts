import { asc, desc, type AnyColumn, type SQL, type SQLWrapper } from "drizzle-orm";
import type { SortInput } from "@plank/common";

export type { SortInput } from "@plank/common";

type OrderableColumn = AnyColumn | SQLWrapper;

/**
 * Build drizzle `orderBy` expressions from sort inputs + an allowlisted column map.
 * Falls back to `defaultOrder` when nothing valid is provided.
 */
export function buildOrderBy(
  sorting: SortInput[] | undefined,
  columns: Record<string, OrderableColumn>,
  defaultOrder: SQL[],
): SQL[] {
  if (!sorting?.length) return defaultOrder;

  const order: SQL[] = [];

  for (const entry of sorting) {
    const column = columns[entry.id];
    if (!column) continue;
    order.push(entry.desc ? desc(column) : asc(column));
  }

  return order.length > 0 ? order : defaultOrder;
}
