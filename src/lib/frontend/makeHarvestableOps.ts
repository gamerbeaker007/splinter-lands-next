import {
  buildBuyWithDecOp,
  buildSwapTokensOp,
} from "@/lib/frontend/opBuilders";
import {
  aggregateCosts,
  computeDecNeededForResource,
  computeInputForDesiredOutput,
  computeSwapAmounts,
  CostEntry,
} from "@/lib/shared/landManagerUtils";
import { calculatePriceImpact } from "@/lib/shared/priceUtils";
import {
  ActionSummary,
  MakeHarvestableStrategy,
  TRADE_HUB_FEE_PCT,
} from "@/types/landManager";
import {
  SplHarvestableResource,
  SplProductionOverviewRegion,
} from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";

export const DEFICIT_BUFFER = 1.02;

const EMPTY_BALANCE: Record<string, number> = {
  GRAIN: 0,
  WOOD: 0,
  STONE: 0,
  IRON: 0,
  AURA: 0,
};

interface Ctx {
  username: string;
  pools: SplLandPool[];
  regions: SplProductionOverviewRegion[];
  costsMap: Record<string, CostEntry[]>;
  working: Record<string, Record<string, number>>;
  ops: [string, object][];
  log: string[];
  decBalance: number;
  actions: ActionSummary[];
}

// ── Shared helpers ────────────────────────────────────────────────────────────

// Returns price impact % for the first AMM hop (resource → DEC).
// Used to warn when pool depth is genuinely low relative to trade size.
function swapPriceImpact(
  pools: SplLandPool[],
  fromSymbol: string,
  inAmount: number
): number {
  if (fromSymbol === "DEC") return 0;
  const fromPool = pools.find((p) => p.token_symbol === fromSymbol);
  if (!fromPool) return 0;
  const { priceImpact } = calculatePriceImpact(
    inAmount,
    Number.parseFloat(fromPool.resource_quantity),
    Number.parseFloat(fromPool.dec_quantity),
    false
  );
  return priceImpact;
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

  const impact = swapPriceImpact(ctx.pools, fromSymbol, inAmount);
  if (impact > 2.5) {
    ctx.log.push(
      `  ⚠ Price impact ${impact.toFixed(1)}% on ${fromSymbol} pool exceeds 2.5% — swap may fail on-chain (pool too shallow)`
    );
  }
  ctx.ops.push(
    buildSwapTokensOp(
      ctx.username,
      fromUid,
      toUid,
      fromSymbol,
      toSymbol,
      inAmount,
      out_amount_1,
      out_amount_2
    )
  );
  ctx.working[fromUid][fromSymbol] =
    (ctx.working[fromUid][fromSymbol] ?? 0) - inAmount;
  ctx.working[toUid][toSymbol] =
    (ctx.working[toUid][toSymbol] ?? 0) + out_amount_2;
  return out_amount_2;
}

// ── Strategies ────────────────────────────────────────────────────────────────

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
    const surplus =
      (ctx.working[donor.region_uid][cost.symbol] ?? 0) - donorCost;
    if (surplus > bestSurplus) {
      bestDonor = donor;
      bestSurplus = surplus;
    }
  }

  const inAmount = Number.parseFloat(
    ((deficit * DEFICIT_BUFFER) / (1 - TRADE_HUB_FEE_PCT / 100)).toFixed(3)
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
      const surplus = (ctx.working[source.region_uid][sym] ?? 0) - srcCost;
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
  transfer: tryTransfer,
  swap: trySwap,
  buy_dec: tryBuyDec,
};

// ── Main ──────────────────────────────────────────────────────────────────────

export function buildMakeHarvestableOps(
  visibleRegions: SplProductionOverviewRegion[],
  username: string,
  harvestableMap: Record<string, SplHarvestableResource[]>,
  balancesMap: Record<string, Record<string, number>>,
  strategies: MakeHarvestableStrategy[],
  initialDecBalance: number,
  pools: SplLandPool[]
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
        { ...(balancesMap[r.region_uid] ?? EMPTY_BALANCE) },
      ])
    ),
    ops: [],
    log: [],
    decBalance: initialDecBalance,
    actions: [],
  };

  for (const region of visibleRegions) {
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
