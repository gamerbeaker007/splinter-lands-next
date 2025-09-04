"use client";

import { createContext, ReactNode, useContext, useState } from "react";
import { CardFilterInput } from "@/types/filters";

type CardFilterContextType = {
  cardFilters: CardFilterInput;
  setCardFilters: React.Dispatch<React.SetStateAction<CardFilterInput>>;
  resetFilters: () => void;
};

const CardFilterContext = createContext<CardFilterContextType | undefined>(
  undefined,
);

export const CardFilterProvider = ({ children }: { children: ReactNode }) => {
  const [cardFilters, setCardFilters] = useState<CardFilterInput>({});

  const resetFilters = () => setCardFilters({});

  return (
    <CardFilterContext.Provider
      value={{ cardFilters, setCardFilters, resetFilters }}
    >
      {children}
    </CardFilterContext.Provider>
  );
};

export const useCardFilters = (): CardFilterContextType => {
  const context = useContext(CardFilterContext);
  if (!context)
    throw new Error("useCardFilters must be used within a CardFilterProvider");
  return context;
};
