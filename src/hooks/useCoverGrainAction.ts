"use client";

import { recordMakeHarvestableLog } from "@/lib/backend/actions/land-manager/log-actions";
import {
  getBulkRegionData,
  getDecBalance,
  getLandPools,
  getPlayerPoolPositions,
  getProductionOverview,
  invalidatePlayerRegionCaches,
} from "@/lib/backend/actions/land-manager/overview-actions";
import { ActionPhase } from "@/lib/shared/actionPhase";
import { computePoolHolding } from "@/lib/shared/poolPositionUtils";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import {
  buildCoverGrainOpsMulti,
  CoverGrainResult,
  CoverGrainTarget,
} from "@/lib/frontend/coverWorksiteGrainOps";
import {
  broadcastOperations,
  waitForTransactions,
} from "@/lib/frontend/splBroadcast";
import { MakeHarvestableStrategy } from "@/types/landManager";
import { DeedComplete } from "@/types/deed";
import { SplPlayerPoolPosition } from "@/types/spl/landPools";
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
  /** Broadcast lifecycle while `status === "covering"` — signing vs. validating. */
  phase: ActionPhase;
  plan: CoverGrainResult | null;
  error: string | null;
  /** Compute the grain-deficit proposal for a deed (fetches fresh region data). */
  buildPlan: (deed: DeedComplete) => Promise<void>;
  /**
   * Compute the proposal for several regions at once (bulk flow). Planning is
   * side-effect free — nothing is broadcast until `confirm()`.
   */
  buildPlanForRegions: (targets: CoverGrainTarget[]) => Promise<void>;
  /** Broadcast the grain-deficit ops (transfer/swap/buy) and record the log. Does NOT feed. */
  confirm: () => Promise<void>;
  reset: () => void;
}

export function useCoverGrainAction({
  username,
  strategies,
}: Params): UseCoverGrainAction {
  const [status, setStatus] = useState<CoverGrainStatus>("idle");
  const [phase, setPhase] = useState<ActionPhase>("idle");
  const [plan, setPlan] = useState<CoverGrainResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setPhase("idle");
    setPlan(null);
    setError(null);
  }, []);

  const buildPlanForRegions = useCallback(
    async (targets: CoverGrainTarget[]) => {
      setStatus("planning");
      setPlan(null);
      setError(null);
      try {
        if (targets.length === 0 || targets.every((t) => t.grainNeeded <= 0)) {
          setError("No worksite with a grain requirement was selected.");
          setStatus("error");
          return;
        }

        const { regions, error: regionsError } = await getProductionOverview();
        if (regionsError) {
          setError(regionsError);
          setStatus("error");
          return;
        }
        const missing = targets.filter(
          (t) => !regions.some((r) => r.region_uid === t.regionUid)
        );
        if (missing.length > 0) {
          setError("Could not load the region for one of the selected plots.");
          setStatus("error");
          return;
        }

        const regionUids = regions.map((r) => r.region_uid);
        const usesPool = strategies.includes("pool");
        const [{ harvestable, balances }, dec, { pools }, positions] =
          await Promise.all([
            getBulkRegionData(regionUids, true),
            getDecBalance(username),
            getLandPools(),
            usesPool
              ? getPlayerPoolPositions(username, NATURAL_RESOURCES, true)
              : Promise.resolve({} as Record<string, SplPlayerPoolPosition>),
          ]);
        const poolHoldings = Object.fromEntries(
          Object.entries(positions).map(([symbol, position]) => [
            symbol,
            computePoolHolding(position, pools),
          ])
        );

        const result = buildCoverGrainOpsMulti({
          username,
          targets,
          regions,
          harvestableMap: harvestable,
          storedBalances: balances,
          strategies,
          decBalance: dec,
          pools,
          poolHoldings,
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

  const buildPlan = useCallback(
    async (deed: DeedComplete) => {
      const grainNeeded = Math.ceil(deed.worksiteDetail?.grain_required ?? 0);
      if (grainNeeded <= 0) {
        setPlan(null);
        setError("This worksite has no grain requirement.");
        setStatus("error");
        return;
      }
      await buildPlanForRegions([{ regionUid: deed.region_uid, grainNeeded }]);
    },
    [buildPlanForRegions]
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
      setPhase("broadcasting");
      const res = await broadcastOperations(username, plan.ops);
      if (!res.success) {
        setError(res.error ?? "Broadcast failed");
        setStatus("error");
        setPhase("idle");
        return;
      }
      setPhase("confirming");
      await waitForTransactions(res.txIds);
      setPhase("idle");
      // Record into the make-harvestable log (shows under "Make Harvestable" in
      // the Today panel). Don't fail the whole action if logging hiccups, but do
      // surface it — a silent miss is what makes "nothing in Today" hard to debug.
      await recordMakeHarvestableLog(username, plan.actions, res.txIds).catch(
        (err) => console.error("Failed to record make-harvestable log", err)
      );
      // Clear the cached pre-action snapshot so the refresh below reads
      // post-action balances rather than winning a cache hit on stale data.
      await invalidatePlayerRegionCaches().catch(() => {});
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
      setPhase("idle");
    }
  }, [plan, username]);

  return {
    status,
    phase,
    plan,
    error,
    buildPlan,
    buildPlanForRegions,
    confirm,
    reset,
  };
}
