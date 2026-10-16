import { isRentedByPlayer } from "@/lib/utils/cardUtil";
import { RenewRentalItem, RenewRentalPlan } from "@/types/landManager";
import { SplSettingsResponse } from "@/types/spl/settings";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";

/**
 * Rentals the player pays for (cards rented FROM others, staked on their
 * plots), pure so the browser can derive them from its own collection read.
 */

const MS_PER_DAY = 86_400_000;

// A card whose next_rental_payment falls within 2 days of the season end is
// expiring at season end (natural end of a fixed-day rental that started a
// few days before EOS). Anything MORE than 2 days past the season end means
// the rental was already renewed into the next season — skip it.
const RENEWAL_BUFFER_MS = 2 * MS_PER_DAY;

export interface RentedCardEntry {
  card_uid: string;
  card_detail_id: number;
  owner: string;
  rental_type: string;
  rental_days: number;
  rental_date: string | null;
  dec_per_day: number;
  total_dec: number;
  stake_plot: number;
  stake_region: number | null;
  stake_end_date: string | null;
  /** Present when the renter has queued a cancellation. */
  cancel_tx: string | null;
  /** land_base_pp from the card's staking data (string → number). */
  base_pp: number;
  /** Market listing ID — needed to cancel or renew the rental. */
  market_id: string | null;
  /** Deed UID the card is staked on (stake_ref_uid). */
  deed_uid: string | null;
}

export interface RentedCardsList {
  cards: RentedCardEntry[];
  total_dec_per_day: number;
  total_dec_for_duration: number;
}

/**
 * Per-card breakdown of rentals the player is paying for: cards where
 * rental_type and stake_plot are set and the owner is someone else. Sorted
 * most-expensive first so the biggest spends show up top.
 */
export function rentedCardsListFrom(
  collection: SplPlayerCardCollection[],
  username: string
): RentedCardsList {
  const cards: RentedCardEntry[] = [];
  let total_dec_per_day = 0;
  let total_dec_for_duration = 0;

  for (const c of collection) {
    if (!isRentedByPlayer(c, username)) continue;
    const perDay = Number(c.buy_price);
    if (!Number.isFinite(perDay) || perDay <= 0) continue;
    const daysNum = Number(c.rental_days);
    const days = Number.isFinite(daysNum) && daysNum > 0 ? daysNum : 0;
    const total = perDay * days;

    cards.push({
      card_uid: c.uid,
      card_detail_id: c.card_detail_id,
      owner: c.player,
      rental_type: c.rental_type ?? "",
      rental_days: days,
      rental_date: c.rental_date ?? null,
      dec_per_day: perDay,
      total_dec: total,
      stake_plot: c.stake_plot,
      stake_region: c.stake_region ?? null,
      stake_end_date: c.stake_end_date ?? null,
      cancel_tx: c.cancel_tx ?? null,
      base_pp: Number(c.land_base_pp) || 0,
      market_id: c.market_id ?? null,
      deed_uid: c.stake_ref_uid ?? null,
    });
    total_dec_per_day += perDay;
    total_dec_for_duration += total;
  }

  cards.sort((a, b) => b.total_dec - a.total_dec);

  return { cards, total_dec_per_day, total_dec_for_duration };
}

function timeMs(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Days left in the current season (99 when /settings is unavailable). */
export function seasonDaysRemaining(
  settings: SplSettingsResponse | null,
  now = Date.now()
): number {
  const currentEndMs = timeMs(settings?.season?.ends);
  return currentEndMs != null
    ? Math.max(0, (currentEndMs - now) / MS_PER_DAY)
    : 99;
}

/**
 * Lightweight eligibility check — how many days remain in the current season
 * and whether the player has any active rentals. Decides whether to show /
 * enable the Renew Rentals button.
 */
export function renewRentalsEligibility(
  settings: SplSettingsResponse | null,
  cards: SplPlayerCardCollection[],
  username: string
): { season_days_remaining: number; has_rentals: boolean; eligible: boolean } {
  const season_days_remaining = seasonDaysRemaining(settings);
  const has_rentals = cards.some((c) => isRentedByPlayer(c, username));
  return {
    season_days_remaining,
    has_rentals,
    eligible: season_days_remaining < 7 && has_rentals,
  };
}

export function emptyRenewRentalPlan(dec_balance: number): RenewRentalPlan {
  return {
    items: [],
    skipped_already_renewed: 0,
    skipped_no_market_id: 0,
    skipped_cancel_tx: 0,
    skipped_not_on_land: 0,
    land_renters_only: false,
    total_dec: 0,
    dec_balance,
    sufficient_balance: true,
    season_days_remaining: 99,
    current_season_end: "unknown",
    next_season_end: null,
  };
}

/**
 * Build the full renewal plan:
 * - Filters cards the player has rented from others (staked on their plots).
 * - Skips cards that already extend past the season end, have no market_id,
 *   or have a pending cancellation (cancel_tx set).
 * - Per-card extend days = ceil((next_season_end − next_rental_payment) / day).
 *   This charges only for the ADDED days, not a full new rental period.
 */
export function buildRenewRentalPlan(input: {
  username: string;
  settings: SplSettingsResponse | null;
  cards: SplPlayerCardCollection[];
  decBalance: number;
  landRentersOnly: boolean;
}): RenewRentalPlan {
  const { username, settings, cards, decBalance, landRentersOnly } = input;
  const now = Date.now();

  // ── Season dates ─────────────────────────────────────────────────────────
  const currentEndIso = settings?.season?.ends ?? null;
  const currentEndMs = timeMs(currentEndIso);
  const nextEndIso = settings?.next_season_end ?? null;
  const nextEndMs = timeMs(nextEndIso);

  // Target end: extend TO next season end; fall back to current season end
  // if next season info is absent.
  const targetEndMs = nextEndMs ?? currentEndMs;

  const season_days_remaining = seasonDaysRemaining(settings, now);

  // ── Filter and build items ────────────────────────────────────────────────
  const items: RenewRentalItem[] = [];
  let skipped_already_renewed = 0;
  let skipped_no_market_id = 0;
  let skipped_cancel_tx = 0;
  let skipped_not_on_land = 0;

  for (const c of cards) {
    if (!isRentedByPlayer(c, username)) continue;

    // land_renters_only: skip cards not currently staked on a land plot.
    if (landRentersOnly && !(c.stake_plot && c.stake_plot > 0)) {
      skipped_not_on_land += 1;
      continue;
    }

    // Skip cards with a pending cancellation — they cannot be renewed.
    if (c.cancel_tx) {
      skipped_cancel_tx += 1;
      continue;
    }

    // Already-renewed check: skip if next_rental_payment is more than
    // RENEWAL_BUFFER_MS past the current season end (it was renewed into
    // the next season). Cards expiring within the buffer are still eligible.
    const nextPaymentMs = c.next_rental_payment
      ? new Date(c.next_rental_payment).getTime()
      : null;

    if (
      currentEndMs != null &&
      nextPaymentMs != null &&
      Number.isFinite(nextPaymentMs) &&
      nextPaymentMs > currentEndMs + RENEWAL_BUFFER_MS
    ) {
      skipped_already_renewed += 1;
      continue;
    }

    // Skip if no market_id (cannot identify listing for renewal).
    if (!c.market_id) {
      skipped_no_market_id += 1;
      continue;
    }

    // ── Per-card extend days ────────────────────────────────────────────────
    // Charge only for the ADDED days: from next_rental_payment → target season
    // end. If next_rental_payment is unknown, fall back to from-now.
    const extendFromMs =
      nextPaymentMs && Number.isFinite(nextPaymentMs) ? nextPaymentMs : now;
    const item_renewal_days =
      targetEndMs != null
        ? Math.max(1, Math.ceil((targetEndMs - extendFromMs) / MS_PER_DAY))
        : 1;

    const dec_per_day = Number(c.buy_price ?? 0);
    const total_dec =
      Number.isFinite(dec_per_day) && dec_per_day > 0
        ? dec_per_day * item_renewal_days
        : 0;

    items.push({
      card_uid: c.uid,
      market_id: c.market_id,
      card_detail_id: c.card_detail_id,
      dec_per_day: Number.isFinite(dec_per_day) ? dec_per_day : 0,
      renewal_days: item_renewal_days,
      total_dec,
      current_rental_end: c.next_rental_payment ?? null,
      stake_plot: c.stake_plot as number,
      stake_region: c.stake_region ?? null,
      owner: c.player,
    });
  }

  const total_dec = items.reduce((s, i) => s + i.total_dec, 0);

  return {
    items,
    skipped_already_renewed,
    skipped_no_market_id,
    skipped_cancel_tx,
    skipped_not_on_land,
    land_renters_only: landRentersOnly,
    total_dec,
    dec_balance: decBalance,
    sufficient_balance: decBalance >= total_dec,
    season_days_remaining,
    current_season_end: currentEndIso ?? "unknown",
    next_season_end: nextEndIso,
  };
}
