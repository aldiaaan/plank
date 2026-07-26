import type { SortInput } from "@plank/common";
import { createParser, parseAsArrayOf } from "nuqs";

/** URL state codec only (`?sorting=createdAt:desc`). API receives `SortInput[]` from the client. */
export const parseAsSort = createParser({
  parse(queryValue): SortInput | null {
    const [id, direction] = queryValue.split(":");
    if (!id) return null;
    return { id, desc: direction === "desc" };
  },
  serialize(value: SortInput) {
    return `${value.id}:${value.desc ? "desc" : "asc"}`;
  },
  eq(a: SortInput, b: SortInput) {
    return a.id === b.id && a.desc === b.desc;
  },
});

export const parseAsSorting = parseAsArrayOf(parseAsSort);
