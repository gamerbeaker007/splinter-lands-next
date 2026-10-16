"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { useSplSession } from "@/hooks/useSplSession";
import { getProductionOverview } from "@/lib/frontend/land-data";
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
  useSyncExternalStore,
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
  /** True until the player's region list has loaded (browser JWT read). */
  regionsLoading: boolean;
  /**
   * The server session exists but this browser holds no SPL token (cleared
   * site data, or a login from before browser-side reads): log in again.
   */
  sessionMissing: boolean;
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
  children: ReactNode;
}

const NO_REGIONS: SplProductionOverviewRegion[] = [];
const noopSubscribe = () => () => {};

export function LandManagerContextProvider({
  auth,
  initialConfig,
  children,
}: ProviderProps) {
  // Loaded once per session from the browser, as the server layout did once
  // per page load; a failure leaves the list empty (as before). The browser
  // session is unknown until hydration, so that counts as loading too.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
  const session = useSplSession();
  const sessionMissing = hydrated && auth.authenticated && !session;
  const regionsKey =
    auth.authenticated && session
      ? `production-overview:${session.username}`
      : null;
  const { data: overview, loading } = useAsyncData(regionsKey, () =>
    getProductionOverview()
  );
  const regionsLoading = !hydrated || loading;
  const allRegions = overview?.regions ?? NO_REGIONS;

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
        regionsLoading,
        sessionMissing,
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
