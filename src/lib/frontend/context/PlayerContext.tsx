"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
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
  const [selectedPlayer, setSelectedPlayerState] = useState<string>(() => {
    // Check if we're in the browser before accessing localStorage
    if (typeof window === "undefined") {
      return "";
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored || "";
  });

  const setSelectedPlayer = useCallback((player: string) => {
    const trimmed = player.trim().toLowerCase();
    setSelectedPlayerState(trimmed);

    // Persist to localStorage (only in browser)
    if (typeof window !== "undefined") {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const clearPlayer = useCallback(() => {
    setSelectedPlayerState("");
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        selectedPlayer,
        setSelectedPlayer,
        clearPlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
