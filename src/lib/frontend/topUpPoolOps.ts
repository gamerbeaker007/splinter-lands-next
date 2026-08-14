import {
  computeDecNeededForResource,
  computeInputForDesiredOutput,
  computeResourceToDec,
  computeResourceToResource,
  computeSwapAmounts,
  poolFor,
} from "@/lib/shared/landManagerUtils";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import {
  SWAP_DONOR_RESERVE_WEEKS,
  TOP_UP_POOL_SAFETY_MARGIN,
  TopUpPoolAddition,
  TopUpPoolFundingStep,
  TopUpPoolPlan,
  TopUpPoolResourcePlan,
  TopUpPoolStrategy,
  TopUpPoolStrategyAttempt,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";

// ─────────────────────────────────────────────────────────────────────────────
// Top Up Pools planner
//
// One execution adds ~110% of a week's consumption of each resource back into
// the liquidity pools, so that deposit matures past the 30-day lock and later
// becomes tax-free withdrawal fuel for Make Harvestable's `pool` strategy. It
// is an INCREMENTAL top-up: an existing multi-week pool balance does not reduce
// this week's target.
//
// Two invariants drive the shape of this file:
//
//  1. DEC is ONE account-wide balance, resources are per region. The plan for
//     ALL resources is computed up front against a single running DEC
//     projection — never per-resource against the same starting balance — so
//     the same DEC is never promised twice.
//  2. Strategies run in the configured order and each covers as much of what is
//     STILL OUTSTANDING as it can, so `["use_owned_dec", "buy_resources"]` means
//     "deposit what I hold, then buy the shortfall". A strategy absent from the
//     list is never used, not even implicitly, which is why `["buy_resources"]`
//     alone buys the whole target and leaves region balances untouched. The
//     combined contributions must still reach the FULL target: a resource that
//     ends short is skipped whole, never partially deposited.
//  3. `swap_resource` is the one strategy that spends a resource OTHER than the
//     one it is funding, so it is the only place a plan can rob Peter to pay
//     Paul. It cannot: every resource keeps its own target plus a week of its
//     own consumption reserved, and only the surplus above that is swappable.
//
// The confirmation dialog and the broadcast both come from one call to
// `buildTopUpPoolPlan` — there is no second code path that could execute
// something other than what the player approved.
// ─────────────────────────────────────────────────────────────────────────────

/** Ignore targets below this — the dust isn't worth a transaction. */
const MIN_TARGET = 10;
/**
 * Smallest resource amount worth acting on.
 *
 * A region holding a fraction of a unit is not a usable source: pairing it with
 * DEC rounds the DEC side to 0 and produces an `add_liquidity` op that spends a
 * block slot to deposit nothing. Below this a balance is treated as absent, and
 * a target is treated as met — being a few units short of a 770k deposit does
 * not matter, whereas a junk op does.
 */
const DUST = 10;
/**
 * Selling/buying moves the AMM price against us, and pool ratios drift between
 * planning and broadcast. Ask for slightly more DEC than the spot quote so the
 * deposit still funds after that drift.
 */
const DEC_SAFETY = 1.02;

const round3 = (n: number): number => Number.parseFloat(n.toFixed(3));

/** Smallest amount the engine accepts, for every token. */
const ENGINE_TICK = 0.001;

/**
 * Turn an inverted quote ("how much must I put in to get X out?") into an op
 * input that actually delivers X.
 *
 * Inverse quotes are truncated to the engine tick, so the input they report is
 * up to one tick BELOW what is really needed — re-quoting it forward then lands
 * short of X and a plan that funds its target exactly gets rejected. Adding one
 * tick back compensates that in full, whatever the exchange rate.
 *
 * A tolerance on the output cannot do this job: the output shortfall is the
 * input shortfall multiplied by the price, so for a cheap resource one DEC tick
 * is worth hundreds of resource units. Fixing it on the input side keeps the
 * correction rate-independent.
 */
const clearingInput = (n: number): number =>
  // round3 last: adding the tick in binary floating point yields values like
  // 7293.128000000001, which would be serialised verbatim into the op payload.
  round3(Math.ceil(n * 1000) / 1000 + ENGINE_TICK);

/**
 * Forward quotes are themselves reported to the engine tick, so a delivered
 * amount can read a fraction of a tick under its true value. Comparisons
 * against a requirement allow that much slack.
 */
const QUOTE_EPSILON = ENGINE_TICK;

export interface TopUpPoolParams {
  regions: SplProductionOverviewRegion[];
  /** Stored (harvested) resource balances per region_uid. */
  balances: Record<string, Record<string, number>>;
  pools: SplLandPool[];
  /** Wallet DEC — account-wide, shared by every resource in this plan. */
  decBalance: number;
  strategies: TopUpPoolStrategy[];
  /** symbol → resource units consumed per 7 days. */
  weeklyConsumption: Record<string, number>;
  /** Regions whose consumption could not be measured (surfaced in the plan). */
  consumptionWarnings?: string[];
}

/** Mutable projection shared across every resource in one plan. */
interface Projection {
  dec: number;
  /** region_uid → symbol → stored resource still unspent by this plan. */
  resource: Record<string, Record<string, number>>;
}

/** What a strategy contributed towards the outstanding target. */
interface StrategyOutcome {
  additions: TopUpPoolAddition[];
  /** Trades this strategy needs broadcast before its deposit. */
  funding: TopUpPoolFundingStep[];
  /** Net DEC change to apply to the projection (negative = spent). */
  decDelta: number;
  /**
   * region_uid → symbol → resource units to deduct from the projection.
   *
   * Keyed by symbol rather than implied by the resource being planned, because
   * `swap_resource` spends a DIFFERENT resource than the one it tops up.
   */
  resourceSpent: Record<string, Record<string, number>>;
  /** Resource units covered — may be less than what was asked for. */
  contributed: number;
  /** One line for the plan describing what this strategy did. */
  note: string;
}

/** A strategy either contributed something, or explains why it could not. */
type StrategyResult = StrategyOutcome | string;

// ── shared helpers ───────────────────────────────────────────────────────────

/** Spot DEC-per-resource ratio — the "equal value" rate for a deposit. */
function decPerResource(pools: SplLandPool[], symbol: string): number {
  const pool = poolFor(pools, symbol);
  if (!pool) return 0;
  const resourceQty = Number.parseFloat(pool.resource_quantity);
  if (resourceQty <= 0) return 0;
  return Number.parseFloat(pool.dec_quantity) / resourceQty;
}

function storedIn(
  projection: Projection,
  regionUid: string,
  symbol: string
): number {
  return projection.resource[regionUid]?.[symbol] ?? 0;
}

/**
 * Regions holding a usable amount of `symbol`, richest first — the deterministic
 * supply order. Balances below {@link DUST} are excluded: they cannot fund a
 * meaningful deposit leg and would only add junk ops.
 */
function donorRegions(
  regions: SplProductionOverviewRegion[],
  projection: Projection,
  symbol: string
): SplProductionOverviewRegion[] {
  return regions
    .filter((r) => storedIn(projection, r.region_uid, symbol) >= DUST)
    .sort(
      (a, b) =>
        storedIn(projection, b.region_uid, symbol) -
        storedIn(projection, a.region_uid, symbol)
    );
}

/**
 * Resource the player can actually put to work, i.e. the sum over donor regions.
 * Sub-{@link DUST} balances are deliberately excluded so funding decisions are
 * made on what is usable rather than on a total padded by fractions of a unit.
 */
function availableResource(
  regions: SplProductionOverviewRegion[],
  projection: Projection,
  symbol: string
): number {
  return donorRegions(regions, projection, symbol).reduce(
    (sum, r) => sum + storedIn(projection, r.region_uid, symbol),
    0
  );
}

/** Accumulate a spend into a region → symbol → amount map. */
function addSpend(
  spent: Record<string, Record<string, number>>,
  regionUid: string,
  symbol: string,
  amount: number
): void {
  spent[regionUid] = {
    ...spent[regionUid],
    [symbol]: (spent[regionUid]?.[symbol] ?? 0) + amount,
  };
}

/** A projection copy with `amount` of `symbol` removed from one region. */
function withReserved(
  projection: Projection,
  regionUid: string,
  symbol: string,
  amount: number
): Projection {
  return {
    dec: projection.dec,
    resource: {
      ...projection.resource,
      [regionUid]: {
        ...projection.resource[regionUid],
        [symbol]: storedIn(projection, regionUid, symbol) - amount,
      },
    },
  };
}

/**
 * Draw `target` units of `symbol` from the regions that hold it, richest first,
 * one deposit leg per region. A resource target legitimately becomes several
 * add_liquidity ops — no single region is assumed to cover it.
 *
 * Returns less than `target` when the regions run dry; the caller decides
 * whether that partial coverage is acceptable.
 */
function allocateAcrossRegions(
  regions: SplProductionOverviewRegion[],
  projection: Projection,
  symbol: string,
  target: number,
  ratio: number
): {
  additions: TopUpPoolAddition[];
  resourceSpent: Record<string, Record<string, number>>;
} {
  const additions: TopUpPoolAddition[] = [];
  const resourceSpent: Record<string, Record<string, number>> = {};
  let remaining = target;

  for (const region of donorRegions(regions, projection, symbol)) {
    // Stop before carving out a sub-DUST tail leg — the caller treats a
    // remainder that small as covered.
    if (remaining < DUST) break;
    const stored = storedIn(projection, region.region_uid, symbol);
    const take = round3(Math.min(remaining, stored));
    if (take <= 0) continue;

    additions.push({
      region_uid: region.region_uid,
      region_name: region.name,
      resource_amount: take,
      dec_amount: round3(take * ratio),
    });
    addSpend(resourceSpent, region.region_uid, symbol, take);
    remaining -= take;
  }

  return { additions, resourceSpent };
}

// ── strategies ───────────────────────────────────────────────────────────────
//
// Every strategy is handed the target still OUTSTANDING for its resource, and
// covers as much of it as it can. Returning less than the whole remainder is a
// normal outcome, not a failure: the next enabled strategy picks up what is
// left. That is what makes `["use_owned_dec", "buy_resources"]` mean "deposit
// what I hold, then buy the shortfall", while `["buy_resources"]` alone means
// "buy the whole target and leave my region balances alone".

/**
 * Deposit resource the player already holds, pairing it with wallet DEC.
 *
 * Nothing is bought or sold, so the contribution is capped by whichever runs out
 * first: the outstanding target, the owned resource, or the wallet DEC needed to
 * pair it.
 */
function tryUseOwnedDec(
  params: TopUpPoolParams,
  projection: Projection,
  symbol: string,
  remaining: number,
  ratio: number
): StrategyResult {
  const available = availableResource(params.regions, projection, symbol);
  if (available < DUST) {
    return `no region holds at least ${DUST} ${symbol}`;
  }

  // Each unit deposited needs `ratio` DEC beside it; DEC_SAFETY keeps a little
  // back for the price drift between planning and broadcast.
  const decCap = ratio > 0 ? projection.dec / (ratio * DEC_SAFETY) : 0;
  if (decCap <= 0) {
    return `no wallet DEC to pair with owned ${symbol} (have ${round3(projection.dec)} DEC)`;
  }

  const cover = Math.min(remaining, available, decCap);
  if (cover < DUST) {
    return `wallet DEC (${round3(projection.dec)}) can only pair ${round3(cover)} ${symbol} — below the ${DUST} minimum`;
  }

  const { additions, resourceSpent } = allocateAcrossRegions(
    params.regions,
    projection,
    symbol,
    cover,
    ratio
  );
  const contributed = additions.reduce((s, a) => s + a.resource_amount, 0);
  const decUsed = additions.reduce((s, a) => s + a.dec_amount, 0);
  if (contributed < DUST) {
    return `no region could supply at least ${DUST} ${symbol} for the deposit`;
  }

  const limit =
    cover >= remaining - QUOTE_EPSILON
      ? ""
      : available <= decCap
        ? ` (limited by owned ${symbol})`
        : ` (limited by wallet DEC)`;

  return {
    additions,
    funding: [],
    decDelta: -decUsed,
    resourceSpent,
    contributed,
    note: `deposited ${round3(contributed)} owned ${symbol} with ${round3(decUsed)} DEC${limit}`,
  };
}

/**
 * Acquire the outstanding resource by purchase and deposit it, without touching
 * the player's stored balances.
 *
 * Because it ignores what the player holds, this strategy covers the whole
 * remainder handed to it — the full weekly target when it runs first, or just
 * the shortfall left by an earlier strategy.
 *
 * The purchase and the deposit draw on the SAME wallet DEC, so both costs are
 * checked together: buying resource that leaves too little DEC to deposit it
 * would strand the purchase. It is all-or-nothing — a half-sized purchase
 * reported as success is exactly what this action must never do.
 */
function tryBuyResources(
  params: TopUpPoolParams,
  projection: Projection,
  symbol: string,
  remaining: number,
  ratio: number
): StrategyResult {
  const toBuy = remaining;

  const decForPurchase = computeDecNeededForResource(
    params.pools,
    symbol,
    toBuy
  );
  if (!Number.isFinite(decForPurchase)) {
    return `the ${symbol} pool cannot supply the ${round3(toBuy)} that must be bought`;
  }

  const decIn = clearingInput(decForPurchase);
  const decForDeposit = toBuy * ratio * DEC_SAFETY;
  if (projection.dec < decIn + decForDeposit) {
    return `insufficient DEC to buy ${round3(toBuy)} ${symbol} and deposit it (have ${round3(projection.dec)}, need ${decIn} to buy + ${round3(decForDeposit)} to deposit)`;
  }

  // The purchase lands in one region, so that is where the deposit is made.
  // Prefer a region that already holds the resource; any enabled region works.
  const buyRegion =
    donorRegions(params.regions, projection, symbol)[0] ?? params.regions[0];
  if (!buyRegion) return "no region available to receive the purchase";

  const { out_amount_2: resourceOut } = computeSwapAmounts(
    params.pools,
    "DEC",
    symbol,
    decIn
  );
  if (resourceOut < toBuy - QUOTE_EPSILON) {
    return `buying ${decIn} DEC of ${symbol} yields only ${round3(resourceOut)} of the ${round3(toBuy)} needed`;
  }

  // Fed entirely by the purchase — no stored resource is consumed.
  const additions: TopUpPoolAddition[] = [
    {
      region_uid: buyRegion.region_uid,
      region_name: buyRegion.name,
      resource_amount: round3(toBuy),
      dec_amount: round3(toBuy * ratio),
    },
  ];
  const decUsed = additions[0].dec_amount;

  return {
    additions,
    funding: [
      {
        kind: "buy",
        region_uid: buyRegion.region_uid,
        region_name: buyRegion.name,
        dec_in: decIn,
        resource_out: round3(resourceOut),
      },
    ],
    decDelta: -(decIn + decUsed),
    resourceSpent: {},
    contributed: round3(toBuy),
    note: `bought ${round3(toBuy)} ${symbol} for ${decIn} DEC in ${buyRegion.name} and deposited it with ${round3(decUsed)} DEC`,
  };
}

/**
 * Deposit owned resource, funding the DEC side by selling more of the same
 * resource instead of spending wallet DEC.
 *
 * Both sides come out of one pile, so the sale must leave the deposit intact:
 *
 *     resource after sale >= resource deposited
 *     DEC after sale      >= DEC required for that deposit
 *
 * The amount to sell comes from the real AMM quote including the 10% trade-hub
 * fee — never a hard-coded multiplier. It lands near 2× the DEC's worth of
 * resource, because roughly half the value has to stay as resource.
 */
function trySellResource(
  params: TopUpPoolParams,
  projection: Projection,
  symbol: string,
  remaining: number,
  ratio: number
): StrategyResult {
  const available = availableResource(params.regions, projection, symbol);
  if (available < DUST) {
    return `no region holds at least ${DUST} ${symbol}`;
  }

  const decNeeded = remaining * ratio * DEC_SAFETY;
  const sellAmount = computeInputForDesiredOutput(
    params.pools,
    symbol,
    "DEC",
    decNeeded
  );
  if (!Number.isFinite(sellAmount) || sellAmount <= 0) {
    return `the ${symbol} pool cannot produce ${round3(decNeeded)} DEC`;
  }

  const sellIn = clearingInput(sellAmount);
  const needed = remaining + sellIn;
  if (available < needed) {
    return `selling enough ${symbol} would leave less than ${round3(remaining)} for the deposit (have ${round3(available)}, need ${round3(needed)})`;
  }

  // One sale, from a region that can cover it alone — splitting it would pay
  // price impact twice for no benefit.
  const sellRegion = donorRegions(params.regions, projection, symbol).find(
    (r) => storedIn(projection, r.region_uid, symbol) >= sellIn
  );
  if (!sellRegion) {
    return `no single region holds the ${sellIn} ${symbol} that must be sold`;
  }

  const { out_amount_2: decOut } = computeResourceToDec(
    params.pools,
    symbol,
    sellIn
  );
  if (decOut < decNeeded - QUOTE_EPSILON) {
    return `selling ${sellIn} ${symbol} yields ${round3(decOut)} DEC, short of the ${round3(decNeeded)} needed`;
  }

  // Reserve the sold resource first, so the deposit legs are drawn from what
  // actually remains after the sale.
  const afterSale = withReserved(
    projection,
    sellRegion.region_uid,
    symbol,
    sellIn
  );
  const { additions, resourceSpent } = allocateAcrossRegions(
    params.regions,
    afterSale,
    symbol,
    remaining,
    ratio
  );
  const contributed = additions.reduce((s, a) => s + a.resource_amount, 0);
  const decUsed = additions.reduce((s, a) => s + a.dec_amount, 0);

  // The sold resource is spent on top of whatever the deposit consumes.
  addSpend(resourceSpent, sellRegion.region_uid, symbol, sellIn);

  return {
    additions,
    funding: [
      {
        kind: "sell",
        region_uid: sellRegion.region_uid,
        region_name: sellRegion.name,
        from_symbol: symbol,
        amount: sellIn,
        dec_out: round3(decOut),
      },
    ],
    decDelta: round3(decOut) - decUsed,
    resourceSpent,
    contributed,
    note: `sold ${sellIn} ${symbol} in ${sellRegion.name} for ~${round3(decOut)} DEC, then deposited ${round3(contributed)} ${symbol}`,
  };
}

/**
 * How much of a donor resource must stay put before any of it may be swapped
 * away: the donor's own top-up target plus the week it burns before the next
 * run. See {@link SWAP_DONOR_RESERVE_WEEKS}.
 */
function donorReserve(params: TopUpPoolParams, symbol: string): number {
  return (params.weeklyConsumption[symbol] ?? 0) * SWAP_DONOR_RESERVE_WEEKS;
}

interface DonorCandidate {
  region: SplProductionOverviewRegion;
  symbol: string;
  surplus: number;
}

/**
 * Every (region, resource) pair holding more than its reserve, richest first.
 *
 * Surplus is measured against the PROJECTION, so resource already committed to
 * an earlier resource's plan in this same run is not offered twice.
 */
function donorCandidates(
  params: TopUpPoolParams,
  projection: Projection,
  wanted: string
): DonorCandidate[] {
  const candidates: DonorCandidate[] = [];

  for (const region of params.regions) {
    for (const symbol of NATURAL_RESOURCES) {
      if (symbol === wanted) continue;
      const surplus =
        storedIn(projection, region.region_uid, symbol) -
        donorReserve(params, symbol);
      if (surplus >= DUST) candidates.push({ region, symbol, surplus });
    }
  }

  return candidates.sort(
    (a, b) =>
      b.surplus - a.surplus ||
      NATURAL_RESOURCES.indexOf(a.symbol) - NATURAL_RESOURCES.indexOf(b.symbol)
  );
}

/** What one donor can fund, after shrinking to fit its surplus. */
interface SwapSizing {
  cover: number;
  swapIn: number;
  sellIn: number;
  decShort: number;
}

/**
 * Size a swap (and its optional funding sale) to fit `surplus`.
 *
 * Both legs are drawn from the same pile, so the sum has to fit; and price
 * impact makes neither leg linear in `cover`. Shrinking `cover` by the observed
 * overshoot and re-quoting converges quickly, and the result is only accepted
 * once the re-quoted total genuinely fits — never on the estimate alone.
 */
function sizeSwap(
  params: TopUpPoolParams,
  projection: Projection,
  symbol: string,
  donorSymbol: string,
  wanted: number,
  surplus: number,
  ratio: number
): SwapSizing | null {
  let cover = wanted;

  for (let attempt = 0; attempt < 5; attempt++) {
    if (cover < DUST) return null;

    const swapIn = clearingInput(
      computeInputForDesiredOutput(params.pools, donorSymbol, symbol, cover)
    );
    if (!Number.isFinite(swapIn) || swapIn <= 0) return null;

    // Wallet DEC first; the donor only has to cover what the wallet cannot.
    const decNeeded = cover * ratio * DEC_SAFETY;
    const decShort = Math.max(0, decNeeded - projection.dec);
    const sellIn =
      decShort > 0
        ? clearingInput(
            computeInputForDesiredOutput(
              params.pools,
              donorSymbol,
              "DEC",
              decShort
            )
          )
        : 0;
    if (!Number.isFinite(sellIn)) return null;

    const total = swapIn + sellIn;
    if (total <= surplus) return { cover, swapIn, sellIn, decShort };

    // Shrink to the fraction that fits, with a little slack so the re-quote
    // lands inside the surplus rather than exactly on it.
    cover = cover * (surplus / total) * 0.99;
  }

  return null;
}

/**
 * Cover the target with a surplus of a DIFFERENT resource.
 *
 * This exists for the lopsided account: short on GRAIN every week, sitting on
 * WOOD it will never burn. One `swap_tokens` op converts the surplus (two AMM
 * hops at 5% each ≈ 9.75%, materially cheaper than selling for DEC and buying
 * back at 10% + 10%), and the DEC side is taken from the wallet, falling back
 * to selling a little more of the same donor when the wallet is short.
 *
 * The donor is protected by {@link donorReserve}: its own top-up target plus a
 * week of its own consumption is untouchable, so fixing GRAIN can never turn
 * WOOD into the skipped resource.
 */
function trySwapResource(
  params: TopUpPoolParams,
  projection: Projection,
  symbol: string,
  remaining: number,
  ratio: number
): StrategyResult {
  const candidates = donorCandidates(params, projection, symbol);
  if (candidates.length === 0) {
    return `no region holds a resource above its own reserve to swap into ${symbol}`;
  }

  for (const donor of candidates) {
    const sizing = sizeSwap(
      params,
      projection,
      symbol,
      donor.symbol,
      remaining,
      donor.surplus,
      ratio
    );
    if (!sizing) continue;

    const { cover, swapIn, sellIn, decShort } = sizing;

    // Forward-quote both legs against the same pool state the plan was sized
    // from; a leg that under-delivers disqualifies this donor rather than
    // producing a deposit that cannot fund itself.
    const swapQuote = computeResourceToResource(
      params.pools,
      donor.symbol,
      symbol,
      swapIn
    );
    if (swapQuote.out_amount_2 < cover - QUOTE_EPSILON) continue;

    const saleQuote =
      sellIn > 0
        ? computeResourceToDec(params.pools, donor.symbol, sellIn)
        : null;
    if (saleQuote && saleQuote.out_amount_2 < decShort - QUOTE_EPSILON)
      continue;

    const decOut = saleQuote ? round3(saleQuote.out_amount_2) : 0;
    const decUsed = round3(cover * ratio);

    // The swap delivers into the donor's own region, so that is where the
    // deposit is made — the same shape `buy_resources` uses.
    const additions: TopUpPoolAddition[] = [
      {
        region_uid: donor.region.region_uid,
        region_name: donor.region.name,
        resource_amount: round3(cover),
        dec_amount: decUsed,
      },
    ];

    const funding: TopUpPoolFundingStep[] = [
      {
        kind: "swap",
        region_uid: donor.region.region_uid,
        region_name: donor.region.name,
        from_symbol: donor.symbol,
        in_amount: swapIn,
        dec_out: swapQuote.out_amount_1,
        resource_out: swapQuote.out_amount_2,
      },
    ];
    if (sellIn > 0) {
      funding.push({
        kind: "sell",
        region_uid: donor.region.region_uid,
        region_name: donor.region.name,
        from_symbol: donor.symbol,
        amount: sellIn,
        dec_out: decOut,
      });
    }

    const resourceSpent: Record<string, Record<string, number>> = {};
    addSpend(
      resourceSpent,
      donor.region.region_uid,
      donor.symbol,
      swapIn + sellIn
    );

    const saleNote =
      sellIn > 0
        ? `, plus ${sellIn} ${donor.symbol} sold for ~${decOut} DEC`
        : "";
    const limit =
      cover >= remaining - QUOTE_EPSILON
        ? ""
        : ` (limited by spare ${donor.symbol} above its own reserve)`;

    return {
      additions,
      funding,
      decDelta: decOut - decUsed,
      resourceSpent,
      contributed: round3(cover),
      note: `swapped ${swapIn} ${donor.symbol} in ${donor.region.name} → ${round3(cover)} ${symbol}${saleNote}${limit}`,
    };
  }

  const best = candidates[0];
  return `spare ${best.symbol} in ${best.region.name} (${round3(best.surplus)} above its own reserve) cannot fund ${round3(remaining)} ${symbol}`;
}

const STRATEGY_FN: Record<
  TopUpPoolStrategy,
  (
    params: TopUpPoolParams,
    projection: Projection,
    symbol: string,
    remaining: number,
    ratio: number
  ) => StrategyResult
> = {
  use_owned_dec: tryUseOwnedDec,
  swap_resource: trySwapResource,
  sell_resource: trySellResource,
  buy_resources: tryBuyResources,
};

// ── planner ──────────────────────────────────────────────────────────────────

/**
 * Collapse legs that target the same region into one deposit.
 *
 * Composing strategies naturally produces two legs for one region — e.g. owned
 * resource from `use_owned_dec` plus a purchase from `buy_resources` that lands
 * in the same place. They are equivalent to a single larger deposit, and merging
 * them saves an op (and therefore a Hive block slot) per duplicate.
 */
function mergeAdditions(additions: TopUpPoolAddition[]): TopUpPoolAddition[] {
  const byRegion = new Map<string, TopUpPoolAddition>();
  for (const a of additions) {
    const existing = byRegion.get(a.region_uid);
    if (existing) {
      existing.resource_amount = round3(
        existing.resource_amount + a.resource_amount
      );
      existing.dec_amount = round3(existing.dec_amount + a.dec_amount);
    } else {
      byRegion.set(a.region_uid, { ...a });
    }
  }
  return [...byRegion.values()];
}

/** Apply a strategy's effects to a projection, returning a new one. */
function applyOutcome(
  projection: Projection,
  outcome: StrategyOutcome
): Projection {
  const resource: Projection["resource"] = { ...projection.resource };
  for (const [uid, spent] of Object.entries(outcome.resourceSpent)) {
    const region = { ...resource[uid] };
    for (const [sym, amount] of Object.entries(spent)) {
      region[sym] = (region[sym] ?? 0) - amount;
    }
    resource[uid] = region;
  }
  return { dec: projection.dec + outcome.decDelta, resource };
}

function skipped(
  symbol: string,
  weekly: number,
  target: number,
  available: number,
  decAvailable: number,
  decRequired: number,
  attempts: TopUpPoolStrategyAttempt[],
  reason: string
): TopUpPoolResourcePlan {
  return {
    symbol,
    weekly_consumption: round3(weekly),
    target: round3(target),
    available_resource: round3(available),
    dec_available: round3(decAvailable),
    dec_required: round3(decRequired),
    attempts,
    contributing_strategies: [],
    funding: [],
    additions: [],
    total_resource: 0,
    total_dec: 0,
    status: "SKIPPED",
    skip_reason: reason,
  };
}

/**
 * Plan one resource: walk the enabled strategies in order, letting each cover as
 * much of the outstanding target as it can, until the target is met.
 *
 * Work happens on a LOCAL copy of the shared projection and is only returned if
 * the full target is reached. A resource that ends short is skipped whole — the
 * spec forbids partial top-ups — and its would-be spending is discarded so it
 * cannot leak into the next resource's budget.
 */
function planResource(
  params: TopUpPoolParams,
  projection: Projection,
  symbol: string,
  weekly: number,
  target: number,
  ratio: number,
  decRequired: number
): { plan: TopUpPoolResourcePlan; projection: Projection } {
  const available = availableResource(params.regions, projection, symbol);
  const startingDec = projection.dec;

  const attempts: TopUpPoolStrategyAttempt[] = [];
  const contributing: TopUpPoolStrategy[] = [];
  const additions: TopUpPoolAddition[] = [];
  const funding: TopUpPoolFundingStep[] = [];
  let local = projection;
  let remaining = target;

  for (const strategy of params.strategies) {
    // A sub-DUST remainder counts as covered: chasing the last few units would
    // only add deposit legs too small to carry any DEC.
    if (remaining < DUST) break;

    const result = STRATEGY_FN[strategy](
      params,
      local,
      symbol,
      remaining,
      ratio
    );
    if (typeof result === "string") {
      attempts.push({ strategy, ok: false, covered: 0, reason: result });
      continue;
    }

    attempts.push({
      strategy,
      ok: true,
      covered: round3(result.contributed),
      reason: result.note,
    });
    contributing.push(strategy);
    additions.push(...result.additions);
    funding.push(...result.funding);
    local = applyOutcome(local, result);
    remaining -= result.contributed;
  }

  if (remaining >= DUST) {
    return {
      // Discard `local`: nothing is spent for a resource that gets skipped.
      projection,
      plan: skipped(
        symbol,
        weekly,
        target,
        available,
        startingDec,
        decRequired,
        attempts,
        params.strategies.length === 0
          ? "no Top Up Pool strategies enabled"
          : `enabled strategies covered only ${round3(target - remaining)} of the ${round3(target)} ${symbol} target`
      ),
    };
  }

  const merged = mergeAdditions(additions);

  return {
    projection: local,
    plan: {
      symbol,
      weekly_consumption: round3(weekly),
      target: round3(target),
      available_resource: round3(available),
      dec_available: round3(startingDec),
      dec_required: round3(decRequired),
      attempts,
      contributing_strategies: contributing,
      funding,
      additions: merged,
      total_resource: round3(merged.reduce((s, a) => s + a.resource_amount, 0)),
      total_dec: round3(merged.reduce((s, a) => s + a.dec_amount, 0)),
      status: "READY",
      skip_reason: null,
    },
  };
}

/**
 * Build the complete top-up plan for every resource, in one pass, against a
 * shared DEC projection. Pure: no fetching, no broadcasting — the confirmation
 * dialog and the broadcast both use exactly this output.
 */
export function buildTopUpPoolPlan(params: TopUpPoolParams): TopUpPoolPlan {
  let projection: Projection = {
    dec: params.decBalance,
    resource: Object.fromEntries(
      params.regions.map((r) => [
        r.region_uid,
        { ...params.balances[r.region_uid] },
      ])
    ),
  };

  const resources: TopUpPoolResourcePlan[] = [];

  for (const symbol of NATURAL_RESOURCES) {
    const weekly = params.weeklyConsumption[symbol] ?? 0;
    const target = weekly * TOP_UP_POOL_SAFETY_MARGIN;
    const ratio = decPerResource(params.pools, symbol);
    const decRequired = target * ratio * DEC_SAFETY;
    const available = availableResource(params.regions, projection, symbol);

    if (target < MIN_TARGET) {
      resources.push(
        skipped(
          symbol,
          weekly,
          target,
          available,
          projection.dec,
          decRequired,
          [],
          weekly <= 0
            ? "no measurable weekly consumption"
            : `weekly target ${round3(target)} is below the ${MIN_TARGET} minimum`
        )
      );
      continue;
    }
    if (ratio <= 0) {
      resources.push(
        skipped(
          symbol,
          weekly,
          target,
          available,
          projection.dec,
          decRequired,
          [],
          `no ${symbol} liquidity pool found`
        )
      );
      continue;
    }

    // Committing the projection between resources is what stops the same DEC
    // being promised to two of them.
    const result = planResource(
      params,
      projection,
      symbol,
      weekly,
      target,
      ratio,
      decRequired
    );
    projection = result.projection;
    resources.push(result.plan);
  }

  const plan: TopUpPoolPlan = {
    resources,
    dec_balance: round3(params.decBalance),
    consumption_warnings: params.consumptionWarnings ?? [],
    log: [],
  };
  plan.log = formatTopUpPoolLog(plan);
  return plan;
}

// ── plan rendering ───────────────────────────────────────────────────────────

const fmt = (n: number): string =>
  n.toLocaleString(undefined, { maximumFractionDigits: 3 });

/**
 * Render the plan grouped by resource, showing the regions involved. The dry
 * run and the executed operations come from the same plan object, so what is
 * printed here is exactly what will be broadcast.
 */
export function formatTopUpPoolLog(plan: TopUpPoolPlan): string[] {
  const log: string[] = [];

  log.push(
    "This action is intended to run ONCE PER WEEK, preferably on about the same day.",
    "Running it more often adds extra resource to the pools; running it less often may",
    "shrink the tax-free buffer available to Make Harvestable.",
    `\nAccount DEC available: ${fmt(plan.dec_balance)} DEC`
  );

  for (const warning of plan.consumption_warnings) {
    log.push(`⚠ ${warning}`);
  }

  for (const r of plan.resources) {
    log.push(
      `\n── ${r.symbol} ────────────────────────────────`,
      `Weekly consumption: ${fmt(r.weekly_consumption)} ${r.symbol}`,
      `Target this execution: ${fmt(r.target)} ${r.symbol} (+10% margin)`,
      `Available ${r.symbol}: ${fmt(r.available_resource)}`,
      `DEC required for pool addition: ${fmt(r.dec_required)}`,
      // Every strategy that ran is listed with what it covered, so the split
      // between them is visible rather than implied.
      "-- Strategy analyses ---------------------"
    );
    for (const a of r.attempts) {
      log.push(
        a.ok
          ? `  ${a.strategy} → covered ${fmt(a.covered)} ${r.symbol}: ${a.reason}`
          : `  ${a.strategy} → FAILED: ${a.reason}`
      );
    }

    if (r.status === "SKIPPED") {
      log.push(`Result: SKIPPED — ${r.skip_reason}`);
      continue;
    }
    log.push(`-- Planned Operations --------------------`);

    for (const step of r.funding) {
      if (step.kind === "sell") {
        log.push(
          `  Sell: ${fmt(step.amount)} ${step.from_symbol} in ${step.region_name} → ~${fmt(step.dec_out)} DEC (after 10% trade-hub fee)`
        );
      } else if (step.kind === "buy") {
        log.push(
          `  Buy: ${fmt(step.dec_in)} DEC → ~${fmt(step.resource_out)} ${r.symbol} in ${step.region_name}`
        );
      } else {
        log.push(
          `  Swap: ${fmt(step.in_amount)} ${step.from_symbol} in ${step.region_name} → ~${fmt(step.resource_out)} ${r.symbol} (two hops, 10% fee)`
        );
      }
    }
    if (r.funding.length === 0) {
      log.push("  Resource acquisition: none · Resource sale: none");
    }

    log.push("  Add to Pool:");
    for (const a of r.additions) {
      log.push(
        `    ${a.region_name}: ${fmt(a.resource_amount)} ${r.symbol} + ${fmt(a.dec_amount)} DEC`
      );
    }
    log.push(
      `  Total pool addition: ${fmt(r.total_resource)} ${r.symbol} + ${fmt(r.total_dec)} DEC`,
      "Result: READY",
      "──────────────────────────────────────────"
    );
  }

  const ready = plan.resources.filter((r) => r.status === "READY");
  if (ready.length === 0) {
    log.push("\nNothing to top up — no resource could be funded.");
  }

  return log;
}
