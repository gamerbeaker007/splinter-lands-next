"use client";

import { useLocalStorageValue } from "@/hooks/useLocalStorageValue";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";

const STORAGE_KEY = "selected-player";

type PlayerContextType = {
  selectedPlayer: string;
  setSelectedPlayer: (player: string) => void;
  clearPlayer: () => void;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
}

type PlayerProviderProps = {
  children: ReactNode;
};

export function PlayerProvider({ children }: PlayerProviderProps) {
  // localStorage is the source of truth (also follows other tabs); "" on the
  // server and during hydration, then the stored player.
  const [stored, setStored] = useLocalStorageValue(STORAGE_KEY);
  const selectedPlayer = stored ?? "";

  const setSelectedPlayer = useCallback(
    (player: string) => setStored(player.trim().toLowerCase()),
    [setStored]
  );

  const clearPlayer = useCallback(() => setStored(""), [setStored]);

  const value = useMemo(
    () => ({ selectedPlayer, setSelectedPlayer, clearPlayer }),
    [selectedPlayer, setSelectedPlayer, clearPlayer]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
