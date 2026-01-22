"use client";

import { getPlayerEfficiency } from "@/lib/backend/actions/efficiency-actions";
import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

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
  const [playerProductionSummaryData, setPlayerProductionSummaryData] =
    useState<PlayerProductionSummaryEnriched[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPlayerEfficiency();
        setPlayerProductionSummaryData(data);
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  return (
    <PlayerEfficiencyContext.Provider value={{ playerProductionSummaryData }}>
      {children}
    </PlayerEfficiencyContext.Provider>
  );
}
