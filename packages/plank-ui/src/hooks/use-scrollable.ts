import { useContext } from "react";

import {
  ScrollableContext,
  type ScrollableContextValue,
} from "../components/scrollable";

export function useScrollable(): ScrollableContextValue {
  const context = useContext(ScrollableContext);

  if (!context) {
    throw new Error("useScrollable must be used within a ScrollableProvider.");
  }

  return context;
}
