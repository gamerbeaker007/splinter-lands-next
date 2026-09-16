"use client";

import { getBulkRegionData } from "@/lib/backend/actions/land-manager/overview-actions";
import { getPlayerWorksiteData } from "@/lib/backend/actions/land-manager/worksite-actions";
import {
  BulkFeedPlan,
  getWorksitePlotState,
  planBulkFeed,
  plotLabelOf,
} from "@/lib/shared/worksiteEligibility";
import { CoverGrainTarget } from "@/lib/frontend/coverWorksiteGrainOps";
import { DeedComplete } from "@/types/deed";
import { useEffect, useMemo, useState } from "react";

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
 * it fresh), but the grain read goes through the *unforced* bulk region call, so
 * it rides the 30s cache the rest of the Land Manager already primes.
 */
export function useWorksiteAlerts(refreshKey: number = 0): WorksiteAlertsData {
  const [deeds, setDeeds] = useState<DeedComplete[]>([]);
  const [regionGrain, setRegionGrain] = useState<Record<string, number>>({});
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { deeds: fetched } = await getPlayerWorksiteData();
        if (cancelled) return;

        const regionUids = [...new Set(fetched.map((d) => d.region_uid))];
        const grain: Record<string, number> = {};
        if (regionUids.length > 0) {
          const { balances } = await getBulkRegionData(regionUids);
          if (cancelled) return;
          for (const uid of regionUids) grain[uid] = balances[uid]?.GRAIN ?? 0;
        }

        setDeeds(fetched);
        setRegionGrain(grain);
        // Stamped together with the data so every check below judges the same
        // instant — a construction that finishes later needs a refresh, which
        // is exactly when this effect re-runs.
        setNowMs(Date.now());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

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
