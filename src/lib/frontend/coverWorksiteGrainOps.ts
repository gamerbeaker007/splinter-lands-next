import { effectiveBalance, EMPTY_BALANCE } from "@/lib/shared/landManagerUtils";
import { ActionSummary, MakeHarvestableStrategy } from "@/types/landManager";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { buildMakeHarvestableOps, RegionBalances } from "./makeHarvestableOps";

export interface CoverGrainResult {
  /** Cover ops to broadcast (transfer/swap/buy) — does NOT include the feed op. */
  ops: [string, object][];
  /** Human-readable plan, one line per step (shown in the confirm dialog). */
  log: string[];
  /** Structured per-action summary for the make-harvestable log. */
  actions: ActionSummary[];
  /** Grain the region must hold to feed the workers. */
  grainNeeded: number;
  /** Grain the region currently holds (stored — ready grain can't feed workers). */
  currentGrain: number;
  /** Grain the plan delivers into the region. */
  delivered: number;
  /** Grain still missing after the plan runs (0 when fully covered). */
  shortfall: number;
  /** True when the plan brings the region up to the full grain requirement. */
  resolved: boolean;
}

/**
 * Plan the resource moves needed to put `grainNeeded` GRAIN into a single region
 * so its ready worksite can be fed (the `update_worksite` op pays grain from the
 * region's *stored* balance).
 *
 * Reuses the Make-All-Harvestable engine: the target region is given a synthetic
 * GRAIN "cost", every other region keeps its real harvest costs as a donor
 * reserve, and only the target is resolved. Strategy order (transfer → swap →
 * buy_dec) follows the player's configured Make-Harvestable strategies.
 *
 * Note on balances: feeding workers spends *stored* grain only — ready (un-
 * harvested) grain can't pay worker food — so the target's effective grain is
 * pinned to its stored amount. Donor regions keep stored+ready as their effective
 * balance (ready covers their own harvest, freeing stored grain to ship).
 */
export function buildCoverGrainOps(params: {
  username: string;
  targetRegion: SplProductionOverviewRegion;
  grainNeeded: number;
  /** All of the player's regions (target included) — donor pool. */
  regions: SplProductionOverviewRegion[];
  /** Real harvestable rows per region_uid (donor harvest-cost reserve). */
  harvestableMap: Record<string, SplHarvestableResource[]>;
  /** Stored resource balances per region_uid. */
  storedBalances: Record<string, Record<string, number>>;
  strategies: MakeHarvestableStrategy[];
  decBalance: number;
  pools: SplLandPool[];
}): CoverGrainResult {
  const {
    username,
    targetRegion,
    grainNeeded,
    regions,
    harvestableMap,
    storedBalances,
    strategies,
    decBalance,
    pools,
  } = params;

  const targetUid = targetRegion.region_uid;
  const currentGrain = storedBalances[targetUid]?.GRAIN ?? 0;

  // Synthetic harvestable: the target "needs" grainNeeded GRAIN. Donors keep
  // their real rows so their own grain stays reserved.
  const syntheticHarvestable: Record<string, SplHarvestableResource[]> = {
    ...harvestableMap,
    [targetUid]: [
      {
        amount_claimable: 0,
        grain_required_for_food: grainNeeded,
        wood_required: 0,
        stone_required: 0,
        iron_required: 0,
        token_symbol: "GRAIN",
      },
    ],
  };

  const stored: Record<string, Record<string, number>> = Object.fromEntries(
    regions.map((r) => [
      r.region_uid,
      { ...(storedBalances[r.region_uid] ?? EMPTY_BALANCE) },
    ])
  );

  const effective: Record<string, Record<string, number>> = Object.fromEntries(
    regions.map((r) => [
      r.region_uid,
      effectiveBalance(storedBalances[r.region_uid] ?? EMPTY_BALANCE, r),
    ])
  );
  // Target feeds from stored grain only — exclude its ready grain from effective.
  effective[targetUid] = { ...effective[targetUid], GRAIN: currentGrain };

  const balances: RegionBalances = { effective, stored };

  const { ops, log, actions } = buildMakeHarvestableOps(
    regions,
    username,
    syntheticHarvestable,
    balances,
    strategies,
    decBalance,
    pools,
    [targetUid]
  );

  // Grain delivered into the target = sum of grain received by every action that
  // lands in this region.
  const delivered = actions.reduce(
    (sum, a) =>
      a.to_region === targetRegion.name && a.to_symbol === "GRAIN"
        ? sum + a.out_amount
        : sum,
    0
  );
  const shortfall = Math.max(0, grainNeeded - (currentGrain + delivered));

  return {
    ops,
    log,
    actions,
    grainNeeded,
    currentGrain,
    delivered,
    shortfall,
    resolved: shortfall === 0,
  };
}
