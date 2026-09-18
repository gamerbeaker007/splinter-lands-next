import {
  buildBuyWithDecOp,
  buildRemoveLiquidityOp,
  buildSwapTokensOp,
} from "@/lib/shared/operations/opBuilders";
import {
  computeRegionResourceBalance,
  MIN_SHARES_OUT,
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
  SplRegionOverviewData,
} from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";

/** Relative safety margin on a shortfall. Floor, not the whole story — see `topUpMargin`. */
export const DEFICIT_BUFFER = 1.02;

/**
 * How much *time* of shortfall growth the top-up must also cover.
 *
 * A harvest cost is not a fixed number: `grain_required_for_food` and the
 * WOOD/STONE/IRON recipe costs accrue continuously since the last harvest, while
 * the region's own output accrues into `*_ready`. So a region's shortfall grows
 * at (consumption - production) per hour for as long as the player takes to get
 * from "Make All Harvestable" to "Harvest All" — plan review, confirm, broadcast,
 * block time, then a second button press.
 *
 * DEFICIT_BUFFER alone cannot cover that: it is a percentage of the *shortfall*,
 * while the drift is proportional to the region's *burn rate*, and the two are
 * unrelated. A 500-unit shortfall in a region burning 4,000/hr got 10 units of
 * cover for 66 units/minute of drift — which is why small top-ups completed
 * successfully and the region was still not harvestable.
 */
export const DRIFT_COVER_MINUTES = 10;

/**
 * Absolute floor on the margin, in resource units. Every op amount is rounded to
 * 3 decimals, and a sub-unit margin can be rounded away entirely.
 */
export const MIN_TOPUP_MARGIN = 1;

/**
 * The engine accepts a swap whose real output is up to `max_slippage` percent
 * below the declared out amount — it does not fail, it succeeds and credits the
 * lower amount. With the builder default of 2.5% that tolerance was *wider* than
 * DEFICIT_BUFFER, so a "successful" buy could still land under the shortfall.
 * Every hub-routed leg is therefore sized with enough headroom to stay above the
 * target even on a worst-case fill.
 */
const SWAP_MAX_SLIPPAGE_PCT = 2.5;
const SLIPPAGE_HEADROOM = 1 / (1 - SWAP_MAX_SLIPPAGE_PCT / 100);

const round3 = (value: number): number => Number.parseFloat(value.toFixed(3));
const ceil3 = (value: number): number => Math.ceil(value * 1000) / 1000;
const floor3 = (value: number): number => Math.floor(value * 1000) / 1000;

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
  // region_uid → symbol → net units the region's shortfall grows by per hour
  // (consumption minus own production). Empty when no overviews were supplied,
  // in which case the margin falls back to DEFICIT_BUFFER / MIN_TOPUP_MARGIN.
  driftPerHour: Record<string, Record<string, number>>;
}

/**
 * How far past the raw shortfall to aim: the largest of the relative buffer, the
 * drift the region accrues before the player actually harvests, and an absolute
 * floor. Returned as extra units, not a multiplier — drift is an absolute rate
 * and does not scale with the shortfall.
 */
function topUpMargin(
  ctx: Ctx,
  regionUid: string,
  symbol: string,
  deficit: number
): number {
  const perHour = ctx.driftPerHour[regionUid]?.[symbol] ?? 0;
  return Math.max(
    deficit * (DEFICIT_BUFFER - 1),
    (perHour * DRIFT_COVER_MINUTES) / 60,
    MIN_TOPUP_MARGIN
  );
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
  // `deficit` already carries the top-up margin; a liquidity withdrawal pays no
  // hub fee and declares no slippage, so it needs no further headroom.
  const fraction = sharesFractionForResource(holding, deficit, used);

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
  if (sharesOut < MIN_SHARES_OUT) {
    ctx.log.push(
      `  - Pool: unlocked ${cost.symbol} position is too small to withdraw ` +
        `(the chain's smallest withdrawal is ${MIN_SHARES_OUT * 100}% of the position)`
    );
    return false;
  }

  // The withdrawal takes the same slice of BOTH reserves, so the DEC side needs
  // no check of its own: it is whatever `sharesOut` of the position is worth.
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

  const inAmount = ceil3((deficit * SLIPPAGE_HEADROOM) / TRADE_HUB_FEE);

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
    deficit * SLIPPAGE_HEADROOM
  );
  // Round the input UP: rounding to nearest can shave the margin back off on
  // small trades, which is exactly the case that was landing short.
  const inAmount = Math.min(ceil3(neededIn), floor3(bestSurplus));
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
    deficit * SLIPPAGE_HEADROOM
  );
  if (!Number.isFinite(decNeeded)) {
    ctx.log.push(
      `  - Buy DEC: pool cannot supply ${deficit.toFixed(0)} ${cost.symbol}`
    );
    return false;
  }

  // Round the DEC input UP and the balance cap DOWN. Rounding the input to the
  // nearest 0.001 could shave more off the buy than the whole margin on a small
  // purchase (a 1-GRAIN top-up came out at 0.995 GRAIN).
  const decAmount = Math.min(floor3(ctx.decBalance), ceil3(decNeeded));
  if (decAmount <= 0) {
    ctx.log.push(
      `  - Buy DEC: ${cost.symbol} top-up rounds to 0 DEC — nothing to buy`
    );
    return false;
  }
  const { out_amount_2: resourceOut } = computeSwapAmounts(
    ctx.pools,
    "DEC",
    cost.symbol,
    decAmount
  );
  const sharesOut = round3(resourceOut);
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
  // Bought resource lands in the region's STORED balance, same as a pool
  // withdrawal or an incoming transfer — keep both ledgers in step.
  ctx.stored[region.region_uid][cost.symbol] =
    (ctx.stored[region.region_uid][cost.symbol] ?? 0) + sharesOut;

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

export interface BuildMakeHarvestableOptions {
  /**
   * When set, only resolve deficits for these region_uids. Every region still
   * contributes its costs as a donor reserve (so we never strip grain another
   * region needs for its own harvest) — we just don't try to *make harvestable*
   * the regions outside this set. Used by the worksite-feed cover flow, which
   * only needs to top up grain in the single region being fed.
   */
  onlyRegionUids?: string[];
  /**
   * region_uid → production overview, used to derive each region's burn rate so
   * the top-up can also cover the shortfall growth between planning and the
   * actual harvest (see `DRIFT_COVER_MINUTES`). Omit for flows whose costs are
   * fixed rather than accruing — the worksite-feed cover plan, for instance —
   * and the margin falls back to DEFICIT_BUFFER / MIN_TOPUP_MARGIN.
   */
  overviews?: Record<string, SplRegionOverviewData>;
}

export function buildMakeHarvestableOps(
  visibleRegions: SplProductionOverviewRegion[],
  username: string,
  harvestableMap: Record<string, SplHarvestableResource[]>,
  balances: RegionBalances,
  strategies: MakeHarvestableStrategy[],
  initialDecBalance: number,
  pools: SplLandPool[],
  options: BuildMakeHarvestableOptions = {}
): { ops: [string, object][]; log: string[]; actions: ActionSummary[] } {
  const { onlyRegionUids, overviews } = options;
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
    driftPerHour: Object.fromEntries(
      visibleRegions.map((r) => [
        r.region_uid,
        overviews
          ? computeRegionResourceBalance(r, overviews[r.region_uid] ?? null)
              .externalNeedPerHour
          : {},
      ])
    ),
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

    const drifting = missing
      .map((m) => {
        const shortfall =
          m.amount - (ctx.working[region.region_uid][m.symbol] ?? 0);
        return {
          symbol: m.symbol,
          margin: topUpMargin(ctx, region.region_uid, m.symbol, shortfall),
          drift:
            ((ctx.driftPerHour[region.region_uid]?.[m.symbol] ?? 0) *
              DRIFT_COVER_MINUTES) /
            60,
        };
      })
      // Only worth a line when the burn rate is what set the margin — otherwise
      // it is just the 2% buffer and says nothing the shortfall didn't.
      .filter((m) => m.margin === m.drift && m.drift > 0);
    if (drifting.length > 0) {
      ctx.log.push(
        `  + margin: ${drifting
          .map((m) => `${m.margin.toFixed(0)} ${m.symbol}`)
          .join(
            ", "
          )} (includes enough extra resources to cover ${DRIFT_COVER_MINUTES} min before harvesting)`
      );
    }

    for (const cost of missing) {
      let resolved = false;
      for (const strategy of strategies) {
        if (resolved) break;
        const shortfall =
          cost.amount - (ctx.working[region.region_uid][cost.symbol] ?? 0);
        if (shortfall <= 0) {
          resolved = true;
          break;
        }
        // Aim past the raw shortfall: harvest costs keep accruing while the
        // plan is confirmed, broadcast and finally harvested.
        const deficit =
          shortfall +
          topUpMargin(ctx, region.region_uid, cost.symbol, shortfall);
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
