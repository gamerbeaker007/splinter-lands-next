"use server";

import { fetchSettings } from "@/lib/backend/api/spl/spl-base-api";
import { getCachedPlayerCardCollection } from "@/lib/backend/services/playerService";
import { isRentedByPlayer } from "@/lib/utils/cardUtil";
import { RenewRentalItem, RenewRentalPlan } from "@/types/landManager";
import { getAuthStatus } from "../auth-actions";
import { getLandManagerConfig } from "./config-actions";
import { getDecBalance } from "./overview-actions";

const MS_PER_DAY = 86_400_000;

// A card whose next_rental_payment falls within 2 days of the season end is
// expiring at season end (natural end of a fixed-day rental that started a
// few days before EOS). Anything MORE than 2 days past the season end means
// the rental was already renewed into the next season — skip it.
const RENEWAL_BUFFER_MS = 2 * MS_PER_DAY;

/**
 * Lightweight eligibility check — returns how many days remain in the
 * current season and whether the player has any active rentals.
 * Used to decide whether to show/enable the Renew Rentals button.
 */
export async function getRenewRentalsEligibility(): Promise<{
  season_days_remaining: number;
  has_rentals: boolean;
  eligible: boolean;
}> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { season_days_remaining: 0, has_rentals: false, eligible: false };
  }

  const [settings, cards] = await Promise.all([
    fetchSettings(),
    getCachedPlayerCardCollection(auth.username),
  ]);

  const now = Date.now();
  const currentEndMs = settings?.season?.ends
    ? new Date(settings.season.ends).getTime()
    : NaN;
  const season_days_remaining = Number.isFinite(currentEndMs)
    ? Math.max(0, (currentEndMs - now) / MS_PER_DAY)
    : 99;

  const has_rentals = cards.some((c) => isRentedByPlayer(c, auth.username!));

  return {
    season_days_remaining,
    has_rentals,
    eligible: season_days_remaining < 7 && has_rentals,
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
export async function getRenewRentalPlan(): Promise<RenewRentalPlan> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return emptyPlan(0);
  }

  // Always force-fetch a fresh card collection — rental state (next_rental_payment,
  // market_id) changes after each renewal and stale cache would cause double-renewals.
  const [settings, cards, decBalance, config] = await Promise.all([
    fetchSettings(),
    getCachedPlayerCardCollection(auth.username, true),
    getDecBalance(auth.username),
    getLandManagerConfig(),
  ]);

  const landRentersOnly = config?.rental.land_renters_only ?? false;

  const now = Date.now();

  // ── Season dates ─────────────────────────────────────────────────────────
  const currentEndIso = settings?.season?.ends ?? null;
  const currentEndMs =
    currentEndIso && Number.isFinite(new Date(currentEndIso).getTime())
      ? new Date(currentEndIso).getTime()
      : null;

  const nextEndIso = settings?.next_season_end ?? null;
  const nextEndMs =
    nextEndIso && Number.isFinite(new Date(nextEndIso).getTime())
      ? new Date(nextEndIso).getTime()
      : null;

  // Target end: extend TO next season end; fall back to current season end
  // if next season info is absent.
  const targetEndMs = nextEndMs ?? currentEndMs;

  const season_days_remaining =
    currentEndMs != null ? Math.max(0, (currentEndMs - now) / MS_PER_DAY) : 99;

  // ── Filter and build items ────────────────────────────────────────────────
  const items: RenewRentalItem[] = [];
  let skipped_already_renewed = 0;
  let skipped_no_market_id = 0;
  let skipped_cancel_tx = 0;
  let skipped_not_on_land = 0;

  for (const c of cards) {
    if (!isRentedByPlayer(c, auth.username)) continue;

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

function emptyPlan(dec_balance: number): RenewRentalPlan {
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
 * Force-fetches the player's card collection to bust the 1-hour cache.
 * Call this after a successful renewal so that the next getRentedCardsList()
 * call sees the updated rental_date / rental_days from the game server.
 */
export async function refreshCardCollection(): Promise<void> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) return;
  await getCachedPlayerCardCollection(auth.username, true);
}
