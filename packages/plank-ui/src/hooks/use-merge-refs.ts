/* eslint-disable react-hooks/exhaustive-deps */
import { type Ref, useMemo } from "react";
import { mergeRefs } from "../utils/merge-refs";

/**
 * Merges multiple refs into a single one and memoizes the result to avoid refs execution on each render.
 * @param refs List of refs to merge.
 * @returns Merged ref.
 */
export function useMergeRefs<T>(refs: (Ref<T> | undefined)[]): Ref<T> {
  return useMemo(() => mergeRefs(refs), refs);
}
