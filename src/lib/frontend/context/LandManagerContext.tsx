"use client";

import {
  DEFAULT_BUY_CONFIG,
  DEFAULT_DONATION_CONFIG,
  DEFAULT_MAKE_HARVESTABLE_STRATEGIES,
  DEFAULT_POST_HARVEST_POOL_PCT,
  DEFAULT_POST_HARVEST_SELL_PCT,
  DEFAULT_POST_HARVEST_STRATEGY,
  DEFAULT_RENTAL_CONFIG,
  LandManagerConfig,
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
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <LandManagerContext.Provider
      value={{
        auth,
        config,
        setConfig,
        allRegions,
        refreshKey,
        triggerRefresh,
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
): LandManagerConfig => ({
  player: username,
  enabled_regions: [],
  make_harvestable_strategies: DEFAULT_MAKE_HARVESTABLE_STRATEGIES,
  donation: DEFAULT_DONATION_CONFIG,
  post_harvest_strategy: DEFAULT_POST_HARVEST_STRATEGY,
  post_harvest_excluded_resources: [],
  post_harvest_sell_pct: DEFAULT_POST_HARVEST_SELL_PCT,
  post_harvest_pool_pct: DEFAULT_POST_HARVEST_POOL_PCT,
  rental: DEFAULT_RENTAL_CONFIG,
  buy: DEFAULT_BUY_CONFIG,
});
