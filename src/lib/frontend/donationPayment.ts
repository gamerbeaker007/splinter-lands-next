import { computeSwapAmounts } from "@/lib/shared/landManagerUtils";
import {
  buildDonationTransferOp,
  isDonationResourceTransferable,
} from "@/lib/shared/operations/opBuilders";
import {
  DEFAULT_DONATION_DAILY_CAPS,
  DEFAULT_DONATION_PCT,
  DEFAULT_DONATION_RECIPIENT,
  DEFAULT_DONATION_RECIPIENT_REGION,
  MythicDeed,
} from "@/types/landManager";
import { SplHarvestableResource } from "@/types/spl/landManager";
import { SplLandPool } from "@/types/spl/landPools";

const round3 = (n: number): number => Number.parseFloat(n.toFixed(3));

/**
 * Minimum donation amount (per region+resource) for natural-resource transfers.
 * Anything below this is skipped — too small to be worth a Hive op and a
 * trade-hub round-trip.
 */
export const MIN_RESOURCE_DONATION_AMOUNT = 5;

interface DonationRegion {
  region_uid: string;
  region_number: number;
  name: string;
}

/** What we'd ideally pay — derived from the harvest amounts, before any cap. */
export interface DesiredDonation {
  region_uid: string;
  region_number: number;
  region_name: string;
  symbol: string;
  amount: number;
}

/** A planned donation after capping against the actual on-chain balance. */
export interface CappedDonation extends DesiredDonation {
  desired_amount: number;
  capped: boolean;
}

/**
 * Build the per-(region, resource) list of donations we want to pay, given what
 * was just harvested. Drops donation-exempt regions/players and soulbound
 * resources here so callers don't need a second filter.
 */
export function planDesiredDonations(
  regions: DonationRegion[],
  harvestable: Record<string, SplHarvestableResource[]>,
  donationFilter: (regionNumber: number) => boolean,
  donationPct: number = DEFAULT_DONATION_PCT
): DesiredDonation[] {
  const donations: DesiredDonation[] = [];
  for (const region of regions) {
    if (!donationFilter(region.region_number)) continue;
    for (const resource of harvestable[region.region_uid] ?? []) {
      if (!isDonationResourceTransferable(resource.token_symbol)) continue;
      const amount = round3((resource.amount_claimable * donationPct) / 100);
      if (amount <= 0) continue;
      if (amount < MIN_RESOURCE_DONATION_AMOUNT) continue;
      donations.push({
        region_uid: region.region_uid,
        region_number: region.region_number,
        region_name: region.name,
        symbol: resource.token_symbol,
        amount,
      });
    }
  }
  return donations;
}

/**
 * Cap each desired donation at the actual balance available in its region. If the
 * region has less than what's owed, pay what we have. If it has zero, the
 * entry drops out entirely.
 */
export function capDonationsAtBalance(
  desired: DesiredDonation[],
  balances: Record<string, Record<string, number>>
): CappedDonation[] {
  const out: CappedDonation[] = [];
  for (const donation of desired) {
    const available = round3(
      balances[donation.region_uid]?.[donation.symbol] ?? 0
    );
    const amount = round3(Math.min(donation.amount, Math.max(available, 0)));
    if (amount <= 0) continue;
    out.push({
      ...donation,
      amount,
      desired_amount: donation.amount,
      capped: amount < donation.amount,
    });
  }
  return out;
}

export interface DonationOpBuckets {
  /** Region swap_tokens donation ops (posting key). One per region+resource. */
  postingOps: [string, object][];
  /** Human-readable lines describing each planned donation, including caps. */
  log: string[];
}

/**
 * Convert a capped plan into Hive ops (posting key only).
 * One swap_tokens op is emitted per region+resource.
 */
export function buildDonationOps(
  username: string,
  pools: SplLandPool[],
  plan: CappedDonation[]
): DonationOpBuckets {
  const postingOps: [string, object][] = [];
  const log: string[] = [];

  for (const donation of plan) {
    const cappedNote = donation.capped
      ? ` (capped from ${donation.desired_amount} — region balance too low)`
      : "";
    const { out_amount_1, out_amount_2 } = computeSwapAmounts(
      pools,
      donation.symbol,
      donation.symbol,
      donation.amount
    );
    postingOps.push(
      buildDonationTransferOp(
        username,
        donation.region_uid,
        DEFAULT_DONATION_RECIPIENT,
        DEFAULT_DONATION_RECIPIENT_REGION,
        donation.symbol,
        donation.amount,
        out_amount_1,
        out_amount_2
      )
    );
    log.push(
      `  donation: ${donation.amount} ${donation.symbol} → ${out_amount_2} to ${DEFAULT_DONATION_RECIPIENT}${cappedNote}`
    );
  }

  return { postingOps, log };
}

/**
 * Build the per-(region, resource) donation list from mythic deed taxes, mirroring
 * planDesiredDonations but consuming the SplTax[] data from tax_collection results.
 * Donations from multiple deeds in the same region are aggregated first.
 */
export function planMythicDonations(
  deeds: MythicDeed[],
  regionNameMap: Map<string, string>,
  donationFilter: (regionNumber: number) => boolean,
  donationPct: number = DEFAULT_DONATION_PCT
): DesiredDonation[] {
  const byRegion = new Map<
    string,
    { regionNumber: number; tokens: Map<string, number> }
  >();
  for (const deed of deeds) {
    if (!donationFilter(deed.region_number)) continue;
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

  const donations: DesiredDonation[] = [];
  for (const [region_uid, { regionNumber, tokens }] of byRegion) {
    const region_name = regionNameMap.get(region_uid) ?? region_uid;
    for (const [symbol, total] of tokens) {
      if (!isDonationResourceTransferable(symbol)) continue;
      const amount = round3((total * donationPct) / 100);
      if (amount <= 0) continue;
      if (amount < MIN_RESOURCE_DONATION_AMOUNT) continue;
      donations.push({
        region_uid,
        region_number: regionNumber,
        region_name,
        symbol,
        amount,
      });
    }
  }
  return donations;
}

/**
 * Reduce desired donations so that the cumulative total paid today (alreadyPaid +
 * this run) does not exceed the per-symbol daily cap defined in DAILY_DONATION_CAPS.
 *
 * - Symbols not listed in DAILY_DONATION_CAPS (e.g. SPS, AURA) are passed through.
 * - Donations are processed in order; headroom is consumed greedily so the first
 *   regions in the list are preferred when the cap is tight.
 * - Entries whose amount is reduced to zero are dropped.
 */
export function applyDailyCaps(
  desired: DesiredDonation[],
  alreadyPaid: Record<string, number>,
  dailyCaps: Record<string, number> = DEFAULT_DONATION_DAILY_CAPS
): DesiredDonation[] {
  // Compute remaining headroom per capped symbol.
  const headroom: Record<string, number> = {};
  for (const [sym, cap] of Object.entries(dailyCaps)) {
    headroom[sym] = Math.max(0, round3(cap - (alreadyPaid[sym] ?? 0)));
  }

  const out: DesiredDonation[] = [];
  for (const donation of desired) {
    if (!(donation.symbol in dailyCaps)) {
      // No daily cap for this symbol — pass through unchanged.
      out.push(donation);
      continue;
    }
    const remaining = headroom[donation.symbol] ?? 0;
    if (remaining <= 0) continue; // Daily cap fully consumed.
    const amount = round3(Math.min(donation.amount, remaining));
    headroom[donation.symbol] = round3(remaining - amount);
    if (amount <= 0) continue;
    out.push({ ...donation, amount });
  }
  return out;
}

/** Sum a donation plan into a { symbol: total } map for persistence. */
export function summarizeDonations(
  plan: { symbol: string; amount: number }[]
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const donation of plan) {
    totals[donation.symbol] = round3(
      (totals[donation.symbol] ?? 0) + donation.amount
    );
  }
  return totals;
}
