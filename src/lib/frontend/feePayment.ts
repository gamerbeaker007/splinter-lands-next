import {
  buildFeeTransferOp,
  buildSpsFeeTransferOp,
  isFeeResourceTransferrable,
} from "@/lib/frontend/opBuilders";
import { computeSwapAmounts } from "@/lib/shared/landManagerUtils";
import {
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
 * trade-hub round-trip. Does NOT apply to SPS, which is consolidated into
 * a single op across all regions so even tiny per-region contributions
 * can sum into a meaningful payment.
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
      if (!isFeeResourceTransferrable(resource.token_symbol)) continue;
      const amount = round3(
        (resource.amount_claimable * SERVICE_FEE_PCT) / 100
      );
      if (amount <= 0) continue;
      // Drop dust fees per resource. SPS is exempt — small per-region amounts
      // are consolidated across regions in buildFeeOps so they still add up
      // to something meaningful.
      if (resource.token_symbol !== "SPS" && amount < MIN_RESOURCE_FEE_AMOUNT) {
        continue;
      }
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
  /**
   * Active-key ops. SPS is global (not region-scoped) so all regions'
   * SPS amounts are consolidated into a single sm_token_transfer here —
   * the user only has to approve one active-key Keychain prompt.
   */
  activeOps: [string, object][];
  /** Human-readable lines describing each planned fee, including caps. */
  log: string[];
}

/**
 * Convert a capped plan into Hive ops, split by required key type. Same-symbol
 * fees go through buildFeeTransferOp (posting key); SPS amounts are summed
 * across regions and emitted as a single buildSpsFeeTransferOp (active key).
 */
export function buildFeeOps(
  username: string,
  pools: SplLandPool[],
  plan: CappedFee[]
): FeeOpBuckets {
  const postingOps: [string, object][] = [];
  const activeOps: [string, object][] = [];
  const log: string[] = [];

  let spsTotal = 0;

  for (const fee of plan) {
    const cappedNote = fee.capped
      ? ` (capped from ${fee.desired_amount} — region balance too low)`
      : "";
    if (fee.symbol === "SPS") {
      spsTotal = round3(spsTotal + fee.amount);
      log.push(`  fee: ${fee.amount} SPS from ${fee.region_name}${cappedNote}`);
      continue;
    }

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

  if (spsTotal > 0) {
    activeOps.push(buildSpsFeeTransferOp(username, spsTotal));
    log.push(
      `  → SPS consolidated: ${spsTotal} SPS → ${SERVICE_FEE_RECIPIENT} (single sm_token_transfer, active key)`
    );
  }

  return { postingOps, activeOps, log };
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
      if (!isFeeResourceTransferrable(symbol)) continue;
      const amount = round3((total * SERVICE_FEE_PCT) / 100);
      if (amount <= 0) continue;
      if (symbol !== "SPS" && amount < MIN_RESOURCE_FEE_AMOUNT) continue;
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
