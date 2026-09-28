"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import { usePoolBufferAlerts } from "@/hooks/usePoolBufferAlerts";
import { useWorksiteAlerts } from "@/hooks/useWorksiteAlerts";
import {
  getPlayerCardAlerts,
  getPlayerDeedAlerts,
} from "@/lib/backend/actions/player/alerts-actions";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import {
  AlertSeverity,
  buildLandManagerAlerts,
  countAlertsBySeverity,
  LandManagerAlert,
  LandManagerAlertsInput,
} from "@/lib/frontend/landManagerAlerts";
import { createContext, ReactNode, useContext, useMemo } from "react";

interface LandManagerAlertsContextType {
  /** True while any alert source is still loading. */
  loading: boolean;
  /** Raw inputs, for the detail views on the Alerts page. */
  input: LandManagerAlertsInput;
  alerts: LandManagerAlert[];
  counts: Record<AlertSeverity, number>;
  /** Errors from the player dashboard checks, if they failed to load. */
  playerAlertsError: string | null;
}

const LandManagerAlertsContext = createContext<
  LandManagerAlertsContextType | undefined
>(undefined);

/**
 * Loads every alert source once for the whole Land Manager, so the Alerts tab
 * can show its counts on every page and the Alerts page opens without a new
 * round of fetches.
 */
export function LandManagerAlertsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { auth, config, allRegions, refreshKey } = useLandManagerContext();
  const username = auth.username ?? "";

  // The buffer only matters to a player who actually withdraws from the pools:
  // its whole purpose is to keep matured liquidity available to the `pool`
  // make-harvestable strategy. Someone who only deposits has nothing to act on.
  const poolStrategyEnabled =
    config.make_harvestable_strategies.includes("pool");
  const { rows: poolBufferRows, loading: poolLoading } = usePoolBufferAlerts(
    allRegions,
    config.enabled_regions,
    poolStrategyEnabled,
    refreshKey
  );
  const regionData = useLandManagerRegionData(refreshKey);
  // The hook returns a fresh object each render; pin it to its parts so the
  // alert list below is only rebuilt when the data actually changes.
  const {
    loading: worksiteLoading,
    feedPlan,
    fixTargets,
    undeveloped,
    hasPending,
  } = useWorksiteAlerts(refreshKey);
  const worksiteAlerts = useMemo(
    () => ({
      loading: worksiteLoading,
      feedPlan,
      fixTargets,
      undeveloped,
      hasPending,
    }),
    [worksiteLoading, feedPlan, fixTargets, undeveloped, hasPending]
  );

  // After an action broadcasts (refreshKey > 0) bypass the server caches, the
  // same way the player dashboard's Refresh button does.
  const playerKey = username ? `${username}\u0000${refreshKey}` : null;
  const force = refreshKey > 0;
  const cardAlerts = useAsyncData(
    playerKey,
    () => getPlayerCardAlerts(username, force),
    "Failed to load player alerts"
  );
  const deedAlerts = useAsyncData(
    playerKey,
    () => getPlayerDeedAlerts(username, force),
    "Failed to load deed alerts"
  );

  const input: LandManagerAlertsInput = useMemo(
    () => ({
      poolBufferRows,
      eligibility: regionData.eligibility,
      stakedDEC: regionData.stakedDEC,
      totalStaked: regionData.totalStaked,
      totalRequired: regionData.totalRequired,
      globalShortfall: regionData.globalShortfall,
      globalExcess: regionData.globalExcess,
      worksiteAlerts,
      cardAlerts: cardAlerts.data,
      deedAlerts: deedAlerts.data,
    }),
    [
      poolBufferRows,
      regionData.eligibility,
      regionData.stakedDEC,
      regionData.totalStaked,
      regionData.totalRequired,
      regionData.globalShortfall,
      regionData.globalExcess,
      worksiteAlerts,
      cardAlerts.data,
      deedAlerts.data,
    ]
  );

  const value = useMemo(() => {
    const alerts = buildLandManagerAlerts(input);
    return {
      loading:
        poolLoading ||
        regionData.loading ||
        worksiteLoading ||
        cardAlerts.loading ||
        deedAlerts.loading,
      input,
      alerts,
      counts: countAlertsBySeverity(alerts),
      playerAlertsError: cardAlerts.error ?? deedAlerts.error,
    };
  }, [
    input,
    poolLoading,
    regionData.loading,
    worksiteLoading,
    cardAlerts.loading,
    cardAlerts.error,
    deedAlerts.loading,
    deedAlerts.error,
  ]);

  return (
    <LandManagerAlertsContext.Provider value={value}>
      {children}
    </LandManagerAlertsContext.Provider>
  );
}

export function useLandManagerAlerts(): LandManagerAlertsContextType {
  const ctx = useContext(LandManagerAlertsContext);
  if (!ctx) {
    throw new Error(
      "useLandManagerAlerts must be used within LandManagerAlertsProvider"
    );
  }
  return ctx;
}
