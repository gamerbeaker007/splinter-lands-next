import {
  buildFeeTransferOp,
  isFeeResourceTransferable,
} from "@/lib/shared/operations/opBuilders";
import { computeSwapAmounts } from "@/lib/shared/landManagerUtils";
import {
  DAILY_FEE_CAPS,
  MythicDeed,
  SERVICE_FEE_PCT,
  SERVICE_FEE_RECIPIENT,
  SERVICE_FEE_RECIPIENT_REGION,
} from "@/types/landManager";
import { SplHarvestableResource } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";

const round3 = (n: number): number => Number.parseFloat(n.toFixed(3));

/**
 * Minimum fee amount (per region+resource) for natural-resource transfers.
 * Anything below this is skipped — too small to be worth a Hive op and a
 * trade-hub round-trip.
 */
export const MIN_RESOURCE_FEE_AMOUNT = 5;

interface FeeRegion {
  region_uid: string;
  region_number: number;
  name: string;
}

/** What we'd ideally pay — derived from the harvest amounts, before any cap. */
export interface DesiredFee {
  region_uid: string;
  region_number: number;
  region_name: string;
  symbol: string;
  amount: number;
}

/** A planned fee after capping against the actual on-chain balance. */
export interface CappedFee extends DesiredFee {
  desired_amount: number;
  capped: boolean;
}

/**
 * Build the per-(region, resource) list of fees we want to pay, given what
 * was just harvested. Drops fee-exempt regions/players and soulbound
 * resources here so callers don't need a second filter.
 */
export function planDesiredFees(
  regions: FeeRegion[],
  harvestable: Record<string, SplHarvestableResource[]>,
  feeFilter: (regionNumber: number) => boolean
): DesiredFee[] {
  const fees: DesiredFee[] = [];
  for (const region of regions) {
    if (!feeFilter(region.region_number)) continue;
    for (const resource of harvestable[region.region_uid] ?? []) {
      if (!isFeeResourceTransferable(resource.token_symbol)) continue;
      const amount = round3(
        (resource.amount_claimable * SERVICE_FEE_PCT) / 100
      );
      if (amount <= 0) continue;
      if (amount < MIN_RESOURCE_FEE_AMOUNT) continue;
      fees.push({
        region_uid: region.region_uid,
        region_number: region.region_number,
        region_name: region.name,
        symbol: resource.token_symbol,
        amount,
      });
    }
  }
  return fees;
}

/**
 * Cap each desired fee at the actual balance available in its region. If the
 * region has less than what's owed, pay what we have. If it has zero, the
 * entry drops out entirely.
 */
export function capFeesAtBalance(
  desired: DesiredFee[],
  balances: Record<string, Record<string, number>>
): CappedFee[] {
  const out: CappedFee[] = [];
  for (const fee of desired) {
    const available = round3(balances[fee.region_uid]?.[fee.symbol] ?? 0);
    const amount = round3(Math.min(fee.amount, Math.max(available, 0)));
    if (amount <= 0) continue;
    out.push({
      ...fee,
      amount,
      desired_amount: fee.amount,
      capped: amount < fee.amount,
    });
  }
  return out;
}

export interface FeeOpBuckets {
  /** Region swap_tokens fee ops (posting key). One per region+resource. */
  postingOps: [string, object][];
  /** Human-readable lines describing each planned fee, including caps. */
  log: string[];
}

/**
 * Convert a capped plan into Hive ops (posting key only).
 * One swap_tokens op is emitted per region+resource.
 */
export function buildFeeOps(
  username: string,
  pools: SplLandPool[],
  plan: CappedFee[]
): FeeOpBuckets {
  const postingOps: [string, object][] = [];
  const log: string[] = [];

  for (const fee of plan) {
    const cappedNote = fee.capped
      ? ` (capped from ${fee.desired_amount} — region balance too low)`
      : "";
    const { out_amount_1, out_amount_2 } = computeSwapAmounts(
      pools,
      fee.symbol,
      fee.symbol,
      fee.amount
    );
    postingOps.push(
      buildFeeTransferOp(
        username,
        fee.region_uid,
        SERVICE_FEE_RECIPIENT_REGION,
        fee.symbol,
        fee.amount,
        out_amount_1,
        out_amount_2
      )
    );
    log.push(
      `  fee: ${fee.amount} ${fee.symbol} → ${out_amount_2} to ${SERVICE_FEE_RECIPIENT}${cappedNote}`
    );
  }

  return { postingOps, log };
}

/**
 * Build the per-(region, resource) fee list from mythic deed taxes, mirroring
 * planDesiredFees but consuming the SplTax[] data from tax_collection results.
 * Taxes from multiple deeds in the same region are aggregated first.
 */
export function planMythicFees(
  deeds: MythicDeed[],
  regionNameMap: Map<string, string>,
  feeFilter: (regionNumber: number) => boolean
): DesiredFee[] {
  const byRegion = new Map<
    string,
    { regionNumber: number; tokens: Map<string, number> }
  >();
  for (const deed of deeds) {
    if (!feeFilter(deed.region_number)) continue;
    if (!byRegion.has(deed.region_uid)) {
      byRegion.set(deed.region_uid, {
        regionNumber: deed.region_number,
        tokens: new Map(),
      });
    }
    const entry = byRegion.get(deed.region_uid)!;
    for (const tax of deed.taxes) {
      entry.tokens.set(
        tax.token,
        (entry.tokens.get(tax.token) ?? 0) + tax.balance
      );
    }
  }

  const fees: DesiredFee[] = [];
  for (const [region_uid, { regionNumber, tokens }] of byRegion) {
    const region_name = regionNameMap.get(region_uid) ?? region_uid;
    for (const [symbol, total] of tokens) {
      if (!isFeeResourceTransferable(symbol)) continue;
      const amount = round3((total * SERVICE_FEE_PCT) / 100);
      if (amount <= 0) continue;
      if (amount < MIN_RESOURCE_FEE_AMOUNT) continue;
      fees.push({
        region_uid,
        region_number: regionNumber,
        region_name,
        symbol,
        amount,
      });
    }
  }
  return fees;
}

/**
 * Reduce desired fees so that the cumulative total paid today (alreadyPaid +
 * this run) does not exceed the per-symbol daily cap defined in DAILY_FEE_CAPS.
 *
 * - Symbols not listed in DAILY_FEE_CAPS (e.g. SPS, AURA) are passed through.
 * - Fees are processed in order; headroom is consumed greedily so the first
 *   regions in the list are preferred when the cap is tight.
 * - Entries whose amount is reduced to zero are dropped.
 */
export function applyDailyCaps(
  desired: DesiredFee[],
  alreadyPaid: Record<string, number>
): DesiredFee[] {
  // Compute remaining headroom per capped symbol.
  const headroom: Record<string, number> = {};
  for (const [sym, cap] of Object.entries(DAILY_FEE_CAPS)) {
    headroom[sym] = Math.max(0, round3(cap - (alreadyPaid[sym] ?? 0)));
  }

  const out: DesiredFee[] = [];
  for (const fee of desired) {
    if (!(fee.symbol in DAILY_FEE_CAPS)) {
      // No daily cap for this symbol — pass through unchanged.
      out.push(fee);
      continue;
    }
    const remaining = headroom[fee.symbol] ?? 0;
    if (remaining <= 0) continue; // Daily cap fully consumed.
    const amount = round3(Math.min(fee.amount, remaining));
    headroom[fee.symbol] = round3(remaining - amount);
    if (amount <= 0) continue;
    out.push({ ...fee, amount });
  }
  return out;
}

/** Sum a fee plan into a { symbol: total } map for persistence. */
export function summarizeFees(
  plan: { symbol: string; amount: number }[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const fee of plan) {
    totals[fee.symbol] = round3((totals[fee.symbol] ?? 0) + fee.amount);
  }
  return totals;
}
