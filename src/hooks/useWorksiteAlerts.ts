"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import {
  getPlayerWorksiteData,
  getRegionGrain,
} from "@/lib/frontend/land-data";
import {
  BulkFeedPlan,
  getWorksitePlotState,
  planBulkFeed,
  plotLabelOf,
} from "@/lib/shared/worksiteEligibility";
import { CoverGrainTarget } from "@/lib/frontend/coverWorksiteGrainOps";
import { DeedComplete } from "@/types/deed";
import { useMemo } from "react";

export interface UndevelopedPlot {
  deedUid: string;
  plotLabel: string;
}

export interface WorksiteAlertsData {
  loading: boolean;
  /** Plots ready to be fed whose region holds enough grain. */
  feedPlan: BulkFeedPlan;
  /** Regions (and totals) the Fix grain deficit flow must top up. */
  fixTargets: CoverGrainTarget[];
  /** Plots with no worksite at all: production is blocked until one is chosen. */
  undeveloped: UndevelopedPlot[];
  /** True when at least one item needs the user's attention. */
  hasPending: boolean;
}

const NO_DEEDS: DeedComplete[] = [];
const NO_GRAIN: Record<string, number> = {};

const EMPTY_PLAN: BulkFeedPlan = {
  feedable: [],
  shortOnGrain: [],
  grainSpentByRegion: {},
  grainNeededByRegion: {},
};

/**
 * Worksite states that are waiting on the player, for the Alerts panel.
 *
 * Every judgement is delegated to `worksiteEligibility` — the same module the
 * Worksite page uses — so the alert counts, the buttons they enable and the ops
 * finally broadcast cannot drift from that page.
 *
 * Note on cost: the deed fetch is deliberately uncached (the Worksite page wants
 * it fresh), but the grain read is *unforced* and region-overview only, so it
 * rides the 30s per-region memo the rest of the Land Manager already primes.
 */
export function useWorksiteAlerts(refreshKey: number = 0): WorksiteAlertsData {
  const { data, loading } = useAsyncData(
    `worksite-alerts:${refreshKey}`,
    async () => {
      const { deeds: fetched } = await getPlayerWorksiteData();
      const regionUids = [...new Set(fetched.map((d) => d.region_uid))];
      const grain =
        regionUids.length > 0 ? await getRegionGrain(regionUids) : NO_GRAIN;
      // Stamped together with the data so every check below judges the same
      // instant — a construction that finishes later needs a refresh, which
      // is exactly when this reloads.
      return { deeds: fetched, regionGrain: grain, nowMs: Date.now() };
    }
  );
  const deeds = data?.deeds ?? NO_DEEDS;
  const regionGrain = data?.regionGrain ?? NO_GRAIN;
  const nowMs = data?.nowMs ?? 0;

  const feedPlan = useMemo(
    () =>
      deeds.length === 0 ? EMPTY_PLAN : planBulkFeed(deeds, regionGrain, nowMs),
    [deeds, regionGrain, nowMs]
  );

  const fixTargets = useMemo<CoverGrainTarget[]>(
    () =>
      Object.entries(feedPlan.grainNeededByRegion).map(
        ([regionUid, grainNeeded]) => ({ regionUid, grainNeeded })
      ),
    [feedPlan.grainNeededByRegion]
  );

  // A plot with no worksite at all earns nothing until the player picks one —
  // mythic (kingdom) plots are excluded because they never take a worksite.
  const undeveloped = useMemo(() => {
    const undev: UndevelopedPlot[] = [];
    for (const deed of deeds) {
      const state = getWorksitePlotState(deed, nowMs);
      if (state.isMythic || !state.isUndeveloped) continue;
      undev.push({ deedUid: deed.deed_uid, plotLabel: plotLabelOf(deed) });
    }
    return undev;
  }, [deeds, nowMs]);

  return {
    loading,
    feedPlan,
    fixTargets,
    undeveloped,
    hasPending:
      feedPlan.feedable.length > 0 ||
      feedPlan.shortOnGrain.length > 0 ||
      undeveloped.length > 0,
  };
}
