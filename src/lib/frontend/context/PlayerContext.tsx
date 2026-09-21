"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "selected-player";

type PlayerContextType = {
  selectedPlayer: string;
  setSelectedPlayer: (player: string) => void;
  clearPlayer: () => void;
};

// localStorage is the source of truth, read through useSyncExternalStore.
// Reading it in an effect instead would mean a second render on every mount
// (and a synchronous setState inside that effect); this way the server
// snapshot is "" and the client renders the stored player straight away.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Also picks up changes made in another tab.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

function getServerSnapshot() {
  return "";
}

function writePlayer(player: string) {
  if (player) {
    localStorage.setItem(STORAGE_KEY, player);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
  listeners.forEach((onChange) => onChange());
}

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
  const selectedPlayer = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const setSelectedPlayer = useCallback((player: string) => {
    writePlayer(player.trim().toLowerCase());
  }, []);

  const clearPlayer = useCallback(() => {
    writePlayer("");
  }, []);

  const value = useMemo(
    () => ({ selectedPlayer, setSelectedPlayer, clearPlayer }),
    [selectedPlayer, setSelectedPlayer, clearPlayer]
  );

  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
