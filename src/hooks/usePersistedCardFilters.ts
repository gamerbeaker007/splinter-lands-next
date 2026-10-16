"use client";

import {
  CardFilterOmitKey,
  cardFilterStorageKey,
  sanitizeCardFilters,
  stripOmittedCardFilters,
} from "@/lib/frontend/utils/cardFilterPersistence";
import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";
import { CardFilterOptions } from "@/types/cardFilter";
import { useCallback, useMemo, useState } from "react";

type Options = {
  /** Filter keys this usage does not expose: never stored, never restored. */
  omit?: readonly CardFilterOmitKey[];
};

/**
 * Card filter state that survives a reload, scoped per usage of the card
 * filter drawer.
 *
 * Renders `initial` until the stored value has hydrated (so SSR and the first
 * client render match), then the validated persisted values. Restoring only
 * ever replaces values that are still valid options; see
 * {@link sanitizeCardFilters}. Nothing is written until the user changes a
 * filter, so a failed read can't overwrite good settings.
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
  const [stored, setStored] = useLocalStorageValue(cardFilterStorageKey(scope));

  // The initial config belongs to the usage and must not re-trigger restoring
  // or resetting on every render (callers pass an inline object literal).
  const [initialConfig] = useState(initial);

  const filters = useMemo(() => {
    if (!stored) return initialConfig;
    try {
      return sanitizeCardFilters(JSON.parse(stored), initialConfig, omit);
    } catch {
      // Unreadable / unparsable payload: keep the usage's initial values.
      return initialConfig;
    }
  }, [stored, initialConfig, omit]);

  const setFilters = useCallback(
    (next: CardFilterOptions) =>
      setStored(JSON.stringify(stripOmittedCardFilters(next, omit))),
    [setStored, omit]
  );

  const resetFilters = useCallback(
    () => setFilters(initialConfig),
    [setFilters, initialConfig]
  );

  return { filters, setFilters, resetFilters };
}
