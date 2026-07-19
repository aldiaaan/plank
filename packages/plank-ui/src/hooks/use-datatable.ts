import { useContext } from "react";

import {
  DataTableContext,
  type DataTableContextType,
} from "../components/data-table";

export function useDataTable<TData = unknown>() {
  const context = useContext(DataTableContext);

  if (!context) {
    throw new Error("useDataTable must be used within a DataTable.Root.");
  }

  return context as DataTableContextType<TData>;
}
