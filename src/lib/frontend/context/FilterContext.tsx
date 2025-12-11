"use client";

import { FilterInput } from "@/types/filters";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

type FilterContextType = {
  filters: FilterInput;
  setFilters: React.Dispatch<React.SetStateAction<FilterInput>>;
  resetFilters: () => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FilterInput>({});

  const resetFilters = useCallback(() => setFilters({}), []);

  return (
    <FilterContext.Provider value={{ filters, setFilters, resetFilters }}>
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
