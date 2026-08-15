import {
  buildBuyWithDecOp,
  buildRemoveLiquidityOp,
  buildSwapTokensOp,
} from "@/lib/shared/operations/opBuilders";
import {
  PoolHolding,
  sharesFractionForResource,
} from "@/lib/shared/poolPositionUtils";
import {
  aggregateCosts,
  computeDecNeededForResource,
  computeInputForDesiredOutput,
  computeSwapAmounts,
  CostEntry,
  EMPTY_BALANCE,
} from "@/lib/shared/landManagerUtils";
import { calculatePriceImpact } from "@/lib/shared/priceUtils";
import { TRADE_HUB_FEE } from "@/lib/shared/statics";
import { ActionSummary, MakeHarvestableStrategy } from "@/types/landManager";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";

export const DEFICIT_BUFFER = 1.02;

/**
 * Don't spend a transaction on a pool withdrawal smaller than this — a dust
 * withdrawal burns a block slot without meaningfully shrinking the deficit.
 */
const MIN_POOL_WITHDRAWAL = 1;

interface Ctx {
  username: string;
  pools: SplLandPool[];
  regions: SplProductionOverviewRegion[];
  costsMap: Record<string, CostEntry[]>;
  // Effective balance (stored + ready). Used to compute deficits — Splinterlands
  // applies ready to costs before stored when harvesting.
  working: Record<string, Record<string, number>>;
  // Stored balance only. Hard upper bound on what a region can ship out via
  // swap/transfer (ready amounts can't move between regions until harvested).
  stored: Record<string, Record<string, number>>;
  ops: [string, object][];
  log: string[];
  decBalance: number;
  actions: ActionSummary[];
  // The player's liquidity position per resource, plus how much of each
  // position this plan has already committed. Positions are account-wide (not
  // per region), so several regions drawing on the same resource must share
  // one budget or the plan would withdraw the same liquidity twice.
  holdings: Record<string, PoolHolding>;
  usedPoolFraction: Record<string, number>;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

// Returns the worst-case price impact % across all AMM hops for a swap.
// Used to warn when pool depth is genuinely low relative to trade size.
function swapPriceImpact(
  pools: SplLandPool[],
  fromSymbol: string,
  toSymbol: string,
  inAmount: number,
  decMidAmount: number
): number {
  if (fromSymbol === toSymbol) return 0;

  if (fromSymbol === "DEC") {
    const pool = pools.find((p) => p.token_symbol === toSymbol);
    if (!pool) return 0;
    return calculatePriceImpact(
      inAmount,
      Number.parseFloat(pool.dec_quantity),
      Number.parseFloat(pool.resource_quantity)
    ).priceImpact;
  }

  const fromPool = pools.find((p) => p.token_symbol === fromSymbol);
  const impact1 = fromPool
    ? calculatePriceImpact(
        inAmount,
        Number.parseFloat(fromPool.resource_quantity),
        Number.parseFloat(fromPool.dec_quantity)
      ).priceImpact
    : 0;

  if (toSymbol === "DEC") return impact1;

  const toPool = pools.find((p) => p.token_symbol === toSymbol);
  const impact2 = toPool
    ? calculatePriceImpact(
        decMidAmount,
        Number.parseFloat(toPool.dec_quantity),
        Number.parseFloat(toPool.resource_quantity)
      ).priceImpact
    : 0;
  return Math.max(impact1, impact2);
}

function commitSwap(
  ctx: Ctx,
  fromUid: string,
  toUid: string,
  fromSymbol: string,
  toSymbol: string,
  inAmount: number
): number {
  const { out_amount_1, out_amount_2 } = computeSwapAmounts(
    ctx.pools,
    fromSymbol,
    toSymbol,
    inAmount
  );

  const impact = swapPriceImpact(
    ctx.pools,
    fromSymbol,
    toSymbol,
    inAmount,
    out_amount_1
  );
  if (impact > 2.5) {
    ctx.log.push(
      `  ⚠ Price impact ${impact.toFixed(1)}% on swap exceeds 2.5% — swap may fail on-chain (pool too shallow)`
    );
  }
  ctx.ops.push(
    buildSwapTokensOp({
      username: ctx.username,
      fromRegionUid: fromUid,
      toRegionUid: toUid,
      fromSymbol,
      toSymbol,
      inAmount,
      outAmount1: out_amount_1,
      outAmount2: out_amount_2,
    })
  );
  ctx.working[fromUid][fromSymbol] =
    (ctx.working[fromUid][fromSymbol] ?? 0) - inAmount;
  ctx.working[toUid][toSymbol] =
    (ctx.working[toUid][toSymbol] ?? 0) + out_amount_2;
  // Mirror the effective movement on the stored ledger so subsequent strategy
  // attempts in the same plan see the post-swap stored balances.
  ctx.stored[fromUid][fromSymbol] =
    (ctx.stored[fromUid][fromSymbol] ?? 0) - inAmount;
  ctx.stored[toUid][toSymbol] =
    (ctx.stored[toUid][toSymbol] ?? 0) + out_amount_2;
  return out_amount_2;
}

// ── Strategies ────────────────────────────────────────────────────────────────

/**
 * Withdraw matured liquidity straight into the region that is short.
 *
 * This is the cheapest source available: liquidity older than 30 days leaves
 * the pool at face value, whereas transfer/swap/buy all pay the 10% trade-hub
 * fee. Only the unlocked slice is ever touched — withdrawing vested liquidity
 * would incur a 10% early-exit penalty and defeat the point of the strategy.
 *
 * The withdrawal returns DEC alongside the resource; that DEC lands in the
 * wallet and is credited to the running balance so a later `buy_dec` step can
 * use it.
 */
function tryPool(
  ctx: Ctx,
  region: SplProductionOverviewRegion,
  cost: CostEntry,
  deficit: number
): boolean {
  const holding = ctx.holdings[cost.symbol];
  if (!holding || holding.resource <= 0) {
    ctx.log.push(`  - Pool: no ${cost.symbol} liquidity position`);
    return false;
  }

  const used = ctx.usedPoolFraction[cost.symbol] ?? 0;
  const wanted = deficit * DEFICIT_BUFFER;
  const fraction = sharesFractionForResource(holding, wanted, used);

  if (fraction <= 0) {
    ctx.log.push(
      holding.unlockedFraction <= 0
        ? `  - Pool: all ${cost.symbol} liquidity is still within the 30-day lock`
        : `  - Pool: unlocked ${cost.symbol} liquidity already fully committed in this plan`
    );
    return false;
  }

  // shares_out is a fraction of the position and the engine reads 3 decimals.
  // Round UP: a large position relative to a small deficit would otherwise
  // truncate to 0.000 and withdraw nothing. Over-withdrawing is harmless — the
  // surplus simply lands in the region — but it must still not reach into the
  // locked slice, so fall back to the largest unlocked step that does fit.
  const remainingUnlocked = Math.max(0, holding.unlockedFraction - used);
  let sharesOut = Math.ceil(fraction * 1000) / 1000;
  if (sharesOut > remainingUnlocked) {
    sharesOut = Math.floor(remainingUnlocked * 1000) / 1000;
  }
  if (sharesOut <= 0) {
    ctx.log.push(
      `  - Pool: unlocked ${cost.symbol} position is too small to withdraw (needs at least 0.1% of the position)`
    );
    return false;
  }

  const resourceOut = sharesOut * holding.resource;
  if (resourceOut < MIN_POOL_WITHDRAWAL) {
    ctx.log.push(
      `  - Pool: withdrawable ${cost.symbol} (${resourceOut.toFixed(3)}) below minimum`
    );
    return false;
  }

  const decOut = sharesOut * holding.dec;

  ctx.ops.push(
    buildRemoveLiquidityOp(
      ctx.username,
      region.region_uid,
      cost.symbol,
      sharesOut
    )
  );
  ctx.usedPoolFraction[cost.symbol] = used + sharesOut;
  ctx.working[region.region_uid][cost.symbol] =
    (ctx.working[region.region_uid][cost.symbol] ?? 0) + resourceOut;
  ctx.stored[region.region_uid][cost.symbol] =
    (ctx.stored[region.region_uid][cost.symbol] ?? 0) + resourceOut;
  ctx.decBalance += decOut;

  ctx.actions.push({
    type: "pool",
    from_region: "POOL",
    to_region: region.name,
    from_symbol: cost.symbol,
    to_symbol: cost.symbol,
    in_amount: sharesOut,
    out_amount: Number.parseFloat(resourceOut.toFixed(3)),
  });

  if (resourceOut >= deficit) {
    ctx.log.push(
      `  ✓ Pool: withdraw ${(sharesOut * 100).toFixed(1)}% of ${cost.symbol} position → ${resourceOut.toFixed(3)} ${cost.symbol} + ${decOut.toFixed(3)} DEC in ${region.name} (no fee)`
    );
    return true;
  }
  ctx.log.push(
    `  ~ Pool partial: withdraw ${(sharesOut * 100).toFixed(1)}% → ${resourceOut.toFixed(3)} ${cost.symbol} (still short ${(deficit - resourceOut).toFixed(0)}; rest is locked)`
  );
  return false;
}

function tryTransfer(
  ctx: Ctx,
  region: SplProductionOverviewRegion,
  cost: CostEntry,
  deficit: number
): boolean {
  let bestDonor: SplProductionOverviewRegion | null = null;
  let bestSurplus = 0;

  for (const donor of ctx.regions) {
    if (donor.region_uid === region.region_uid) continue;
    const donorCost =
      ctx.costsMap[donor.region_uid].find((c) => c.symbol === cost.symbol)
        ?.amount ?? 0;
    // Swappable surplus = how much we can ship without breaking the donor's
    // own harvest. Capped by stored balance (ready amounts can't move).
    const effectiveSurplus =
      (ctx.working[donor.region_uid][cost.symbol] ?? 0) - donorCost;
    const stored = ctx.stored[donor.region_uid][cost.symbol] ?? 0;
    const surplus = Math.min(stored, effectiveSurplus);
    if (surplus > bestSurplus) {
      bestDonor = donor;
      bestSurplus = surplus;
    }
  }

  const inAmount = Number.parseFloat(
    ((deficit * DEFICIT_BUFFER) / TRADE_HUB_FEE).toFixed(3)
  );

  if (!bestDonor || bestSurplus < inAmount) {
    ctx.log.push(
      bestDonor
        ? `  - Transfer: ${bestDonor.name} surplus ${bestSurplus.toFixed(0)} ${cost.symbol} < needed ${inAmount.toFixed(0)}`
        : `  - Transfer: no region with surplus ${cost.symbol}`
    );
    return false;
  }

  const received = commitSwap(
    ctx,
    bestDonor.region_uid,
    region.region_uid,
    cost.symbol,
    cost.symbol,
    inAmount
  );
  ctx.actions.push({
    type: "transfer",
    from_region: bestDonor.name,
    to_region: region.name,
    from_symbol: cost.symbol,
    to_symbol: cost.symbol,
    in_amount: inAmount,
    out_amount: received,
  });
  ctx.log.push(
    `  ✓ Transfer: ${inAmount} ${cost.symbol} from ${bestDonor.name} → receive ${received.toFixed(3)} in ${region.name}`
  );
  return true;
}

function trySwap(
  ctx: Ctx,
  region: SplProductionOverviewRegion,
  cost: CostEntry,
  deficit: number
): boolean {
  let bestSource: SplProductionOverviewRegion | null = null;
  let bestSymbol = "";
  let bestSurplus = 0;

  for (const source of ctx.regions) {
    for (const sym of ["GRAIN", "WOOD", "STONE", "IRON"]) {
      if (sym === cost.symbol) continue;
      const srcCost =
        ctx.costsMap[source.region_uid].find((c) => c.symbol === sym)?.amount ??
        0;
      // Swappable surplus = how much we can ship without breaking the donor's
      // own harvest. Capped by stored balance (ready amounts can't move).
      const effectiveSurplus =
        (ctx.working[source.region_uid][sym] ?? 0) - srcCost;
      const stored = ctx.stored[source.region_uid][sym] ?? 0;
      const surplus = Math.min(stored, effectiveSurplus);
      if (surplus > bestSurplus) {
        bestSource = source;
        bestSymbol = sym;
        bestSurplus = surplus;
      }
    }
  }

  if (!bestSource || !bestSymbol || bestSurplus <= 0) {
    ctx.log.push(`  - Swap: no surplus resource found`);
    return false;
  }

  const neededIn = computeInputForDesiredOutput(
    ctx.pools,
    bestSymbol,
    cost.symbol,
    deficit * DEFICIT_BUFFER
  );
  const inAmount = Number.parseFloat(
    Math.min(neededIn, bestSurplus).toFixed(3)
  );
  const received = commitSwap(
    ctx,
    bestSource.region_uid,
    region.region_uid,
    bestSymbol,
    cost.symbol,
    inAmount
  );
  ctx.actions.push({
    type: "swap",
    from_region: bestSource.name,
    to_region: region.name,
    from_symbol: bestSymbol,
    to_symbol: cost.symbol,
    in_amount: inAmount,
    out_amount: received,
  });

  if (received >= deficit) {
    ctx.log.push(
      `  ✓ Swap: ${inAmount} ${bestSymbol} from ${bestSource.name} → ${received.toFixed(3)} ${cost.symbol} in ${region.name}`
    );
    return true;
  }
  ctx.log.push(
    `  ~ Swap partial: ${inAmount} ${bestSymbol} → ${received.toFixed(3)} ${cost.symbol} (still short ${(deficit - received).toFixed(0)})`
  );
  return false;
}

function tryBuyDec(
  ctx: Ctx,
  region: SplProductionOverviewRegion,
  cost: CostEntry,
  deficit: number
): boolean {
  if (ctx.decBalance <= 0) {
    ctx.log.push(`  - Buy DEC: balance is 0`);
    return false;
  }

  const decNeeded = computeDecNeededForResource(
    ctx.pools,
    cost.symbol,
    deficit * DEFICIT_BUFFER
  );
  if (!Number.isFinite(decNeeded)) {
    ctx.log.push(
      `  - Buy DEC: pool cannot supply ${deficit.toFixed(0)} ${cost.symbol}`
    );
    return false;
  }

  const decAmount = Number.parseFloat(
    Math.min(ctx.decBalance, decNeeded).toFixed(3)
  );
  const { out_amount_2: resourceOut } = computeSwapAmounts(
    ctx.pools,
    "DEC",
    cost.symbol,
    decAmount
  );
  const sharesOut = Number.parseFloat(resourceOut.toFixed(3));
  ctx.actions.push({
    type: "buy_dec",
    from_region: "DEC",
    to_region: region.name,
    from_symbol: "DEC",
    to_symbol: cost.symbol,
    in_amount: decAmount,
    out_amount: sharesOut,
  });

  ctx.ops.push(
    buildBuyWithDecOp(
      ctx.username,
      region.region_uid,
      decAmount,
      sharesOut,
      cost.symbol
    )
  );
  ctx.decBalance -= decAmount;
  ctx.working[region.region_uid][cost.symbol] =
    (ctx.working[region.region_uid][cost.symbol] ?? 0) + sharesOut;

  if (sharesOut >= deficit) {
    ctx.log.push(
      `  ✓ Buy: ${decAmount} DEC → ${sharesOut} ${cost.symbol} in ${region.name}`
    );
    return true;
  }
  ctx.log.push(
    `  ~ Buy partial: ${decAmount} DEC → ${sharesOut} ${cost.symbol} (still short ${(deficit - sharesOut).toFixed(0)})`
  );
  return false;
}

const STRATEGY_FN: Record<MakeHarvestableStrategy, typeof tryTransfer> = {
  pool: tryPool,
  transfer: tryTransfer,
  swap: trySwap,
  buy_dec: tryBuyDec,
};

// ── Main ──────────────────────────────────────────────────────────────────────

export interface RegionBalances {
  /** Stored balance + ready-to-harvest (for deficit checks). */
  effective: Record<string, Record<string, number>>;
  /** Stored balance only (caps what can leave a region via swap/transfer). */
  stored: Record<string, Record<string, number>>;
  /**
   * The player's liquidity position per resource symbol, already converted to
   * resource/DEC units. Account-wide, not per region. Omit (or leave empty) to
   * disable the `pool` strategy — it then reports "no liquidity position" and
   * falls through to the next strategy.
   */
  poolHoldings?: Record<string, PoolHolding>;
}

export function buildMakeHarvestableOps(
  visibleRegions: SplProductionOverviewRegion[],
  username: string,
  harvestableMap: Record<string, SplHarvestableResource[]>,
  balances: RegionBalances,
  strategies: MakeHarvestableStrategy[],
  initialDecBalance: number,
  pools: SplLandPool[],
  // When set, only resolve deficits for these region_uids. Every region still
  // contributes its costs as a donor reserve (so we never strip grain another
  // region needs for its own harvest) — we just don't try to *make harvestable*
  // the regions outside this set. Used by the worksite-feed cover flow, which
  // only needs to top up grain in the single region being fed.
  onlyRegionUids?: string[]
): { ops: [string, object][]; log: string[]; actions: ActionSummary[] } {
  const ctx: Ctx = {
    username,
    pools,
    regions: visibleRegions,
    costsMap: Object.fromEntries(
      visibleRegions.map((r) => [
        r.region_uid,
        aggregateCosts(harvestableMap[r.region_uid] ?? []),
      ])
    ),
    working: Object.fromEntries(
      visibleRegions.map((r) => [
        r.region_uid,
        { ...(balances.effective[r.region_uid] ?? EMPTY_BALANCE) },
      ])
    ),
    stored: Object.fromEntries(
      visibleRegions.map((r) => [
        r.region_uid,
        { ...(balances.stored[r.region_uid] ?? EMPTY_BALANCE) },
      ])
    ),
    ops: [],
    log: [],
    decBalance: initialDecBalance,
    actions: [],
    holdings: balances.poolHoldings ?? {},
    usedPoolFraction: {},
  };

  for (const region of visibleRegions) {
    if (onlyRegionUids && !onlyRegionUids.includes(region.region_uid)) continue;
    const missing = ctx.costsMap[region.region_uid].filter(
      ({ symbol, amount }) =>
        (ctx.working[region.region_uid][symbol] ?? 0) < amount
    );
    if (missing.length === 0) continue;

    ctx.log.push(
      `\n[${region.name}] needs: ${missing
        .map(
          (m) =>
            `${(m.amount - (ctx.working[region.region_uid][m.symbol] ?? 0)).toFixed(0)} ${m.symbol}`
        )
        .join(", ")}`
    );

    for (const cost of missing) {
      let resolved = false;
      for (const strategy of strategies) {
        if (resolved) break;
        const deficit =
          cost.amount - (ctx.working[region.region_uid][cost.symbol] ?? 0);
        if (deficit <= 0) {
          resolved = true;
          break;
        }
        resolved = STRATEGY_FN[strategy](ctx, region, cost, deficit);
      }

      if (!resolved) {
        const finalDeficit =
          cost.amount - (ctx.working[region.region_uid][cost.symbol] ?? 0);
        if (finalDeficit > 0)
          ctx.log.push(
            `  ✗ Could not resolve ${finalDeficit.toFixed(0)} ${cost.symbol} shortage`
          );
      }
    }
  }

  return { ops: ctx.ops, log: ctx.log, actions: ctx.actions };
}
