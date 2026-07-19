import { createParser, parseAsArrayOf } from "nuqs";

export type SortInput = {
  id: string;
  desc: boolean;
};

/** URL state codec only (`?sorting=createdAt:desc`). API receives `SortInput[]` from the client. */
export const parseAsSort = createParser({
  parse(queryValue) {
    const [id, direction] = queryValue.split(":");
    if (!id) return null;
    return { id, desc: direction === "desc" };
  },
  serialize(value) {
    return `${value.id}:${value.desc ? "desc" : "asc"}`;
  },
  eq(a, b) {
    return a.id === b.id && a.desc === b.desc;
  },
});

export const parseAsSorting = parseAsArrayOf(parseAsSort);
