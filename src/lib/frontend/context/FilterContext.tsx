"use client";

import { FilterInput } from "@/types/filters";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

/**
 * Override for location filter options only (region / tract / plot). When set,
 * the FilterDrawer uses these in place of the globally-fetched location lists.
 * Categorical filters (rarity, resources, worksites, deed_type, plot_status)
 * always come from the global fetch.
 */
export type LocationOverride = Partial<
  Pick<FilterInput, "filter_regions" | "filter_tracts" | "filter_plots">
> | null;

type FilterContextType = {
  filters: FilterInput;
  setFilters: React.Dispatch<React.SetStateAction<FilterInput>>;
  resetFilters: () => void;
  locationOverride: LocationOverride;
  setLocationOverride: (override: LocationOverride) => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FilterInput>({});
  const [locationOverride, setLocationOverride] =
    useState<LocationOverride>(null);

  const resetFilters = useCallback(() => setFilters({}), []);

  return (
    <FilterContext.Provider
      value={{
        filters,
        setFilters,
        resetFilters,
        locationOverride,
        setLocationOverride,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (!context)
    throw new Error("useFilters must be used within a FilterProvider");
  return context;
};
