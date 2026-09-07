"use client";

import {
  createDefaultLandManagerConfig,
  LandManagerConfig,
  LandManagerConfigSection,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

export interface LandManagerAuthStatus {
  authenticated: boolean;
  username: string | null | undefined;
}

interface LandManagerContextType {
  auth: LandManagerAuthStatus;
  config: LandManagerConfig;
  setConfig: (config: LandManagerConfig) => void;
  allRegions: SplProductionOverviewRegion[];
  refreshKey: number;
  triggerRefresh: () => void;
  configDialogOpen: boolean;
  configDialogSection: LandManagerConfigSection | null;
  openConfigDialog: (section?: LandManagerConfigSection) => void;
  closeConfigDialog: () => void;
}

const LandManagerContext = createContext<LandManagerContextType | undefined>(
  undefined
);

interface ProviderProps {
  auth: LandManagerAuthStatus;
  initialConfig: LandManagerConfig;
  allRegions: SplProductionOverviewRegion[];
  children: ReactNode;
}

export function LandManagerContextProvider({
  auth,
  initialConfig,
  allRegions,
  children,
}: ProviderProps) {
  const [config, setConfig] = useState<LandManagerConfig>(initialConfig);
  const [refreshKey, setRefreshKey] = useState(0);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configDialogSection, setConfigDialogSection] =
    useState<LandManagerConfigSection | null>(null);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const openConfigDialog = useCallback((section?: LandManagerConfigSection) => {
    setConfigDialogSection(section ?? null);
    setConfigDialogOpen(true);
  }, []);
  const closeConfigDialog = useCallback(() => {
    setConfigDialogOpen(false);
    setConfigDialogSection(null);
  }, []);

  return (
    <LandManagerContext.Provider
      value={{
        auth,
        config,
        setConfig,
        allRegions,
        refreshKey,
        triggerRefresh,
        configDialogOpen,
        configDialogSection,
        openConfigDialog,
        closeConfigDialog,
      }}
    >
      {children}
    </LandManagerContext.Provider>
  );
}

export function useLandManagerContext(): LandManagerContextType {
  const ctx = useContext(LandManagerContext);
  if (!ctx)
    throw new Error(
      "useLandManagerContext must be used within LandManagerContextProvider"
    );
  return ctx;
}

export const DEFAULT_LAND_MANAGER_CONFIG = (
  username: string
): LandManagerConfig => createDefaultLandManagerConfig(username);
