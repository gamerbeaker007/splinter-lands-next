"use client";

import { recordMakeHarvestableLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getDecBalance,
  getLandPools,
  getProductionOverview,
} from "@/lib/backend/actions/land-manager/overview-actions";
import {
  buildCoverGrainOps,
  CoverGrainResult,
} from "@/lib/frontend/coverWorksiteGrainOps";
import {
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { MakeHarvestableStrategy } from "@/types/landManager";
import { DeedComplete } from "@/types/deed";
import { useCallback, useState } from "react";

export type CoverGrainStatus =
  | "idle"
  | "planning"
  | "ready"
  | "covering"
  | "done"
  | "error";

interface Params {
  username: string;
  strategies: MakeHarvestableStrategy[];
}

interface UseCoverGrainAction {
  status: CoverGrainStatus;
  plan: CoverGrainResult | null;
  error: string | null;
  /** Compute the grain-deficit proposal for a deed (fetches fresh region data). */
  buildPlan: (deed: DeedComplete) => Promise<void>;
  /** Broadcast the grain-deficit ops (transfer/swap/buy) and record the log. Does NOT feed. */
  confirm: () => Promise<void>;
  reset: () => void;
}

export function useCoverGrainAction({
  username,
  strategies,
}: Params): UseCoverGrainAction {
  const [status, setStatus] = useState<CoverGrainStatus>("idle");
  const [plan, setPlan] = useState<CoverGrainResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setPlan(null);
    setError(null);
  }, []);

  const buildPlan = useCallback(
    async (deed: DeedComplete) => {
      setStatus("planning");
      setPlan(null);
      setError(null);
      try {
        const grainNeeded = Math.ceil(deed.worksiteDetail?.grain_required ?? 0);
        if (grainNeeded <= 0) {
          setError("This worksite has no grain requirement.");
          setStatus("error");
          return;
        }

        const { regions, error: regionsError } = await getProductionOverview();
        if (regionsError) {
          setError(regionsError);
          setStatus("error");
          return;
        }
        const targetRegion = regions.find(
          (r) => r.region_uid === deed.region_uid
        );
        if (!targetRegion) {
          setError("Could not load the region for this plot.");
          setStatus("error");
          return;
        }

        const regionUids = regions.map((r) => r.region_uid);
        const [{ harvestable, balances }, dec, { pools }] = await Promise.all([
          getBulkRegionData(regionUids, true),
          getDecBalance(username),
          getLandPools(),
        ]);

        const result = buildCoverGrainOps({
          username,
          targetRegion,
          grainNeeded,
          regions,
          harvestableMap: harvestable,
          storedBalances: balances,
          strategies,
          decBalance: dec,
          pools,
        });

        setPlan(result);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    },
    [username, strategies]
  );

  const confirm = useCallback(async () => {
    if (!plan) return;
    if (plan.ops.length === 0) {
      // Nothing to move — region already has the grain.
      setStatus("done");
      return;
    }
    setError(null);
    try {
      // Bring grain into the region (transfer → swap → buy). This does NOT feed
      // the workers — the player uses the Feed workers button afterwards. We
      // wait for confirmation so a follow-up refresh shows the new balance.
      setStatus("covering");
      const res = await broadcastOperations(username, plan.ops);
      if (!res.success) {
        setError(res.error ?? "Broadcast failed");
        setStatus("error");
        return;
      }
      await waitForTransactions(res.txIds);
      // Record into the make-harvestable log (shows under "Make Harvestable" in
      // the Today panel). Don't fail the whole action if logging hiccups, but do
      // surface it — a silent miss is what makes "nothing in Today" hard to debug.
      await recordMakeHarvestableLog(username, plan.actions, res.txIds).catch(
        (err) => console.error("Failed to record make-harvestable log", err)
      );
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }, [plan, username]);

  return { status, plan, error, buildPlan, confirm, reset };
}
