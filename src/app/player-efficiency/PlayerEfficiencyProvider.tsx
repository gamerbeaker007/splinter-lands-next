"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getPlayerEfficiency } from "@/lib/backend/actions/efficiency-actions";
import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { createContext, ReactNode, useContext } from "react";

type PlayerEfficiencyContextType = {
  playerProductionSummaryData: PlayerProductionSummaryEnriched[] | null;
};

const PlayerEfficiencyContext =
  createContext<PlayerEfficiencyContextType | null>(null);

export function usePlayerEfficiency() {
  const context = useContext(PlayerEfficiencyContext);
  if (!context) {
    throw new Error(
      "usePlayerEfficiency must be used within PlayerEfficiencyProvider"
    );
  }
  return context;
}

type PlayerEfficiencyProviderProps = {
  children: ReactNode;
};

export function PlayerEfficiencyProvider({
  children,
}: PlayerEfficiencyProviderProps) {
  const { data } = useAsyncData("player-efficiency", () =>
    getPlayerEfficiency()
  );
  const playerProductionSummaryData = data ?? null;

  return (
    <PlayerEfficiencyContext.Provider value={{ playerProductionSummaryData }}>
      {children}
    </PlayerEfficiencyContext.Provider>
  );
}
