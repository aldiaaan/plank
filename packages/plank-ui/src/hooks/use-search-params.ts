import {
  createParser,
  parseAsInteger,
  useQueryState,
  useQueryStates,
} from "nuqs";
import { createMultiParser } from "nuqs/server";
import qs from "qs";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { functionalUpdate } from "@tanstack/react-table";
import {
  parseAsSort,
  parseAsSorting,
} from "@plank/db/queries/sort-parser";

export { parseAsSort };

function createPaginationParsers(options: {
  defaultPageIndex?: number;
  defaultPageSize?: number;
}) {
  return {
    pageIndex: parseAsInteger
      .withDefault(options.defaultPageIndex ?? 1)
      .withOptions({
        scroll: true,
      }),
    pageSize: parseAsInteger.withDefault(options.defaultPageSize ?? 20),
  };
}

const paginationUrlKeys = {
  pageIndex: "page",
  pageSize: "perPage",
};

export function usePaginationSearchParams(
  options: {
    defaultPageIndex?: number;
    defaultPageSize?: number;
  } = {},
) {
  return useQueryStates(
    createPaginationParsers(
      options ?? {
        defaultPageIndex: 1,
        defaultPageSize: 50,
      },
    ),
    {
      urlKeys: paginationUrlKeys,
    },
  );
}

export function useSortingSearchParams() {
  const [sorting, setSorting] = useQueryState(
    "sorting",
    parseAsSorting.withDefault([]),
  );

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    void setSorting((current) => {
      const next = functionalUpdate(updater, current ?? []);
      return next.length > 0 ? next : [];
    });
  };

  return [sorting, onSortingChange] as const;
}

export type ParsedFilterValueSymbols = {
  eq?: string | number;
  in?: (string | number | null)[];
  gte?: string | number;
  lte?: string | number;
};

export type ParsedFilterValue = {
  id: string;
  value: ParsedFilterValueSymbols | undefined;
};

const parseAsKeyValue = createParser({
  parse: (value) => {
    const parsed = qs.parse(value) as {
      [key: string]: ParsedFilterValueSymbols & { range?: string };
    };

    const parsedKey = Object.keys(parsed)[0];
    const entry = parsed[parsedKey];

    if (entry?.range) {
      if (typeof entry.range !== "string") return null;

      const [gte, lte] = entry.range.split("...");

      return {
        id: parsedKey,
        value: {
          gte,
          lte,
        },
      };
    }

    return {
      id: parsedKey,
      value: entry,
    };
  },
  serialize: (value) => {
    return qs.stringify(value, { encode: true });
  },
});

const parseAsFilters = () => {
  return createMultiParser({
    parse: (values) => {
      const parsed = values
        .map(parseAsKeyValue.parse)
        .filter((v) => v !== null) as ParsedFilterValue[];

      return parsed;
    },
    serialize: (values) => {
      return values
        .map(({ id, value }) => {
          if (!value) return "";

          let obj: Record<string, unknown>;

          if (value.gte != null && value.lte != null) {
            obj = { range: `${value.gte}...${value.lte}` };
          } else if (value.in != null) {
            obj = { in: value.in };
          } else if (value.eq != null) {
            obj = { eq: value.eq };
          } else if (value.gte != null || value.lte != null) {
            obj = {
              ...(value.gte != null ? { gte: value.gte } : {}),
              ...(value.lte != null ? { lte: value.lte } : {}),
            };
          } else {
            return "";
          }

          return qs.stringify({ [id]: obj }, { encode: false });
        })
        .filter((v) => v !== "");
    },
  });
};

export function useFilterSearchParams() {
  return useQueryState("filters", parseAsFilters().withDefault([]));
}
