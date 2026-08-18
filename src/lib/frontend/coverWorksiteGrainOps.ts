import { effectiveBalance, EMPTY_BALANCE } from "@/lib/shared/landManagerUtils";
import { PoolHolding } from "@/lib/shared/poolPositionUtils";
import { ActionSummary, MakeHarvestableStrategy } from "@/types/landManager";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";
import { buildMakeHarvestableOps, RegionBalances } from "./makeHarvestableOps";

/** One region that must end up holding `grainNeeded` GRAIN. */
export interface CoverGrainTarget {
  regionUid: string;
  /** Total grain the region must hold (not the delta — the full requirement). */
  grainNeeded: number;
}

/** Per-region outcome of a cover plan — the bulk dialog renders one row each. */
export interface CoverGrainRegionResult {
  regionUid: string;
  regionName: string;
  grainNeeded: number;
  currentGrain: number;
  delivered: number;
  shortfall: number;
  resolved: boolean;
}

export interface CoverGrainResult {
  /** Cover ops to broadcast (transfer/swap/buy) — does NOT include the feed op. */
  ops: [string, object][];
  /** Human-readable plan, one line per step (shown in the confirm dialog). */
  log: string[];
  /** Structured per-action summary for the make-harvestable log. */
  actions: ActionSummary[];
  /** Grain all target regions must hold to feed their workers. */
  grainNeeded: number;
  /** Grain the target regions currently hold (stored — ready grain can't feed workers). */
  currentGrain: number;
  /** Grain the plan delivers into the target regions. */
  delivered: number;
  /** Grain still missing after the plan runs (0 when fully covered). */
  shortfall: number;
  /** True when the plan brings every target region up to its full requirement. */
  resolved: boolean;
  /** Breakdown per target region (single entry for the single-plot flow). */
  regions: CoverGrainRegionResult[];
}

/**
 * Plan the resource moves needed to put the required GRAIN into one or more
 * regions so their ready worksites can be fed (the `update_worksite` op pays
 * grain from the region's *stored* balance).
 *
 * Reuses the Make-All-Harvestable engine: each target region is given a synthetic
 * GRAIN "cost", every other region keeps its real harvest costs as a donor
 * reserve, and only the targets are resolved. Strategy order (pool → transfer →
 * swap → buy_dec) follows the player's configured Make-Harvestable strategies.
 *
 * Planning all targets in one pass matters for the bulk flow: donors, the DEC
 * balance and the pool position are shared budgets, so resolving region by
 * region would hand out the same grain twice.
 *
 * Note on balances: feeding workers spends *stored* grain only — ready (un-
 * harvested) grain can't pay worker food — so each target's effective grain is
 * pinned to its stored amount. Donor regions keep stored+ready as their effective
 * balance (ready covers their own harvest, freeing stored grain to ship).
 */
export function buildCoverGrainOpsMulti(params: {
  username: string;
  targets: CoverGrainTarget[];
  /** All of the player's regions (targets included) — donor pool. */
  regions: SplProductionOverviewRegion[];
  /** Real harvestable rows per region_uid (donor harvest-cost reserve). */
  harvestableMap: Record<string, SplHarvestableResource[]>;
  /** Stored resource balances per region_uid. */
  storedBalances: Record<string, Record<string, number>>;
  strategies: MakeHarvestableStrategy[];
  decBalance: number;
  pools: SplLandPool[];
  /** Player liquidity positions, needed only when the `pool` strategy is enabled. */
  poolHoldings?: Record<string, PoolHolding>;
}): CoverGrainResult {
  const {
    username,
    targets,
    regions,
    harvestableMap,
    storedBalances,
    strategies,
    decBalance,
    pools,
    poolHoldings,
  } = params;

  const targetUids = targets.map((t) => t.regionUid);

  // Synthetic harvestable: each target "needs" its grainNeeded GRAIN. Donors keep
  // their real rows so their own grain stays reserved.
  const syntheticHarvestable: Record<string, SplHarvestableResource[]> = {
    ...harvestableMap,
  };
  for (const target of targets) {
    syntheticHarvestable[target.regionUid] = [
      {
        amount_claimable: 0,
        grain_required_for_food: target.grainNeeded,
        wood_required: 0,
        stone_required: 0,
        iron_required: 0,
        token_symbol: "GRAIN",
      },
    ];
  }

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
  // Targets feed from stored grain only — exclude their ready grain from effective.
  for (const uid of targetUids) {
    effective[uid] = {
      ...effective[uid],
      GRAIN: storedBalances[uid]?.GRAIN ?? 0,
    };
  }

  const balances: RegionBalances = { effective, stored, poolHoldings };

  const { ops, log, actions } = buildMakeHarvestableOps(
    regions,
    username,
    syntheticHarvestable,
    balances,
    strategies,
    decBalance,
    pools,
    targetUids
  );

  const regionResults: CoverGrainRegionResult[] = targets.map((target) => {
    const region = regions.find((r) => r.region_uid === target.regionUid);
    const regionName = region?.name ?? target.regionUid;
    const currentGrain = storedBalances[target.regionUid]?.GRAIN ?? 0;
    // Grain delivered into this region = sum of grain received by every action
    // that lands there.
    const delivered = actions.reduce(
      (sum, a) =>
        a.to_region === regionName && a.to_symbol === "GRAIN"
          ? sum + a.out_amount
          : sum,
      0
    );
    const shortfall = Math.max(
      0,
      target.grainNeeded - (currentGrain + delivered)
    );
    return {
      regionUid: target.regionUid,
      regionName,
      grainNeeded: target.grainNeeded,
      currentGrain,
      delivered,
      shortfall,
      resolved: shortfall === 0,
    };
  });

  const sum = (pick: (r: CoverGrainRegionResult) => number) =>
    regionResults.reduce((total, r) => total + pick(r), 0);

  return {
    ops,
    log,
    actions,
    grainNeeded: sum((r) => r.grainNeeded),
    currentGrain: sum((r) => r.currentGrain),
    delivered: sum((r) => r.delivered),
    shortfall: sum((r) => r.shortfall),
    resolved: regionResults.every((r) => r.resolved),
    regions: regionResults,
  };
}
