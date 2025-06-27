"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { FilterInput } from "@/types/filters";

type FilterContextType = {
  filters: FilterInput;
  setFilters: React.Dispatch<React.SetStateAction<FilterInput>>;
  resetFilters: () => void;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FilterInput>({});

  const resetFilters = () => setFilters({});

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
