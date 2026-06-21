"use server";
import {
  fetchEmptySlotsByDeed,
  getWorkerEligibility,
} from "@/lib/backend/actions/land-manager/worker-actions";
import { buildRentalPlan } from "@/lib/backend/services/landRentalService";
import { getCachedPlayerCardCollection } from "@/lib/backend/services/playerService";
import { isRentedByPlayer } from "@/lib/utils/cardUtil";
import {
  DEFAULT_RENTAL_CONFIG,
  RentalConfig,
  RentalPlan,
} from "@/types/landManager";
import { getAuthStatus } from "../auth-actions";

export interface RentedCardsSpendSummary {
  card_count: number;
  total_dec_per_day: number;
  total_dec_for_duration: number;
}

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
 * Sums what the current player is spending on cards rented FROM other players
 * and currently staked on one of their plots. Filters the player's collection
 * to cards where rental_type and stake_plot are set and the owning player
 * (`player` field on the card) is not the authenticated user.
 */
export async function getRentedCardsSpend(): Promise<RentedCardsSpendSummary> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { card_count: 0, total_dec_per_day: 0, total_dec_for_duration: 0 };
  }

  const cards = await getCachedPlayerCardCollection(auth.username);
  let card_count = 0;
  let total_dec_per_day = 0;
  let total_dec_for_duration = 0;
  for (const c of cards) {
    if (!isRentedByPlayer(c, auth.username)) continue;
    const perDay = Number(c.buy_price);
    if (!Number.isFinite(perDay) || perDay <= 0) continue;
    const days = Number(c.rental_days);
    const safeDays = Number.isFinite(days) && days > 0 ? days : 0;

    card_count += 1;
    total_dec_per_day += perDay;
    total_dec_for_duration += perDay * safeDays;
  }

  return { card_count, total_dec_per_day, total_dec_for_duration };
}

/**
 * Per-card breakdown of rentals the current player is paying for. Same filter
 * as {@link getRentedCardsSpend} but returns each card individually so the UI
 * can render a paginated table with DEC/day and total DEC per row.
 */
export async function getRentedCardsList(): Promise<RentedCardsList> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { cards: [], total_dec_per_day: 0, total_dec_for_duration: 0 };
  }

  const collection = await getCachedPlayerCardCollection(auth.username);
  const cards: RentedCardEntry[] = [];
  let total_dec_per_day = 0;
  let total_dec_for_duration = 0;

  for (const c of collection) {
    if (!isRentedByPlayer(c, auth.username)) continue;
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

  // Sort most-expensive first so the user sees the biggest spends up top.
  cards.sort((a, b) => b.total_dec - a.total_dec);

  return { cards, total_dec_per_day, total_dec_for_duration };
}

export interface RentalExecutionPlan {
  plan: RentalPlan;
  // deed_uid -> ordered list of empty slot numbers (1-based).
  emptySlotsByDeed: Record<string, number[]>;
}

export async function getRentalExecutionPlan(
  enabledRegions: number[],
  rental: RentalConfig = DEFAULT_RENTAL_CONFIG
): Promise<RentalExecutionPlan> {
  const eligibility = await getWorkerEligibility(enabledRegions);
  const plan = await buildRentalPlan(eligibility.eligible, rental);
  const emptySlotsByDeed = await fetchEmptySlotsByDeed(plan);

  return { plan, emptySlotsByDeed };
}
