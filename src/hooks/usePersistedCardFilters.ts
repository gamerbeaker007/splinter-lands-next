"use client";

import {
  CardFilterOmitKey,
  cardFilterStorageKey,
  sanitizeCardFilters,
  stripOmittedCardFilters,
} from "@/lib/frontend/utils/cardFilterPersistence";
import { CardFilterOptions } from "@/types/cardFilter";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Options = {
  /** Filter keys this usage does not expose: never stored, never restored. */
  omit?: readonly CardFilterOmitKey[];
};

/**
 * Card filter state that survives a reload, scoped per usage of the card
 * filter drawer.
 *
 * Starts from `initial` (so SSR and the first client render match), then
 * overlays the validated persisted values on mount. Restoring only ever
 * replaces values that are still valid options; see
 * {@link sanitizeCardFilters}.
 */
export function usePersistedCardFilters(
  scope: string,
  initial: CardFilterOptions,
  options: Options = {}
): {
  filters: CardFilterOptions;
  setFilters: (next: CardFilterOptions) => void;
  resetFilters: () => void;
} {
  const omit = useMemo(() => options.omit ?? [], [options.omit]);
  const storageKey = cardFilterStorageKey(scope);

  const [filters, setFilters] = useState<CardFilterOptions>(initial);
  // The initial config belongs to the usage and must not re-trigger restoring
  // or resetting on every render (callers pass an inline object literal).
  const initialRef = useRef(initial);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw)
        setFilters(
          sanitizeCardFilters(JSON.parse(raw), initialRef.current, omit)
        );
    } catch {
      // Unreadable / unparsable payload: keep the usage's initial values.
    }
    setRestored(true);
  }, [storageKey, omit]);

  // Only write after restoring, so a failed read can't overwrite good settings.
  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify(stripOmittedCardFilters(filters, omit))
      );
    } catch {
      // Storage full or blocked: persistence is best-effort.
    }
  }, [filters, restored, storageKey, omit]);

  const resetFilters = useCallback(() => setFilters(initialRef.current), []);

  return { filters, setFilters, resetFilters };
}
