"use server";
import {
  fetchProductionOverview,
  fetchRegionDataPlayer,
  fetchStakedAssets,
} from "@/lib/backend/api/spl/spl-land-api";
import { buildRentalPlan } from "@/lib/backend/services/landRentalService";
import { getCachedPlayerCardCollection } from "@/lib/backend/services/playerService";
import { isRentedByPlayer } from "@/lib/utils/cardUtil";
import {
  DEFAULT_RENTAL_CONFIG,
  RentalConfig,
  RentalEligibilityResult,
  RentalEligiblePlot,
  RentalPlan,
} from "@/types/landManager";
import { Card, StakedAssets } from "@/types/stakedAssets";
import { cookies } from "next/headers";
import pLimit from "p-limit";
import { getAuthStatus } from "../auth-actions";

export async function getRentalEligibility(
  enabledRegions: number[]
): Promise<RentalEligibilityResult> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) {
    return { eligible: [], unpoweredSkipped: [] };
  }

  if (enabledRegions.length === 0) {
    return { eligible: [], unpoweredSkipped: [] };
  }

  const regionData = await fetchRegionDataPlayer(auth.username);
  const stakingByDeed = new Map(
    regionData.staking_details.map((s) => [s.deed_uid, s])
  );
  const worksiteByDeed = new Map(
    regionData.worksite_details.map((s) => [s.deed_uid, s])
  );
  const enabledSet = new Set(enabledRegions);

  const eligible: RentalEligiblePlot[] = [];
  const unpoweredSkipped: RentalEligiblePlot[] = [];

  for (const deed of regionData.deeds) {
    if (!enabledSet.has(deed.region_number)) continue;

    const staking = stakingByDeed.get(deed.deed_uid);
    if (!staking) continue;
    const worksiteDetails = worksiteByDeed.get(deed.deed_uid) ?? null;

    const maxWorkers = staking.max_workers_allowed ?? 0;
    const workerCount = staking.worker_count ?? 0;

    const plot: RentalEligiblePlot = {
      ...deed,
      worksiteDetail: worksiteDetails,
      stakingDetail: staking,
      worker_count: workerCount,
      max_workers: maxWorkers,
      empty_slots: maxWorkers - workerCount,
      is_powered: staking.is_powered ?? false,
      biome_modifiers: {
        fire: staking.red_biome_modifier ?? 0,
        water: staking.blue_biome_modifier ?? 0,
        life: staking.white_biome_modifier ?? 0,
        death: staking.black_biome_modifier ?? 0,
        earth: staking.green_biome_modifier ?? 0,
        dragon: staking.gold_biome_modifier ?? 0,
      },
    };

    if (!plot.is_powered) {
      unpoweredSkipped.push(plot);
    } else {
      if (workerCount < maxWorkers) {
        eligible.push(plot);
      }
    }
  }

  const byRegionThenPlot = (a: RentalEligiblePlot, b: RentalEligiblePlot) =>
    a.region_number - b.region_number || a.plot_number - b.plot_number;

  eligible.sort(byRegionThenPlot);
  unpoweredSkipped.sort(byRegionThenPlot);

  return { eligible, unpoweredSkipped };
}

export interface RegionDECInfo {
  region_number: number;
  region_uid: string;
  total_plot_count: number;
  dec_stake_needed: number;
  dec_stake_in_use: number;
}

export interface RegionStakedDEC {
  /** Per-region rows for the enabled regions, sorted by region number. */
  regions: RegionDECInfo[];
  /**
   * Account-wide DEC currently staked (the global `dark_energy` pool). This is
   * the source of truth for whether enough DEC is staked overall — a region's
   * `dec_stake_in_use` can temporarily read 0 while a building is in progress,
   * even though that DEC is still staked in the global pool.
   */
  totalStaked: number;
  /** Sum of `dark_energy_required` across ALL of the player's regions. */
  totalRequired: number;
}

const EMPTY_STAKED_DEC: RegionStakedDEC = {
  regions: [],
  totalStaked: 0,
  totalRequired: 0,
};

export async function getRegionStakedDEC(
  enabledRegions: number[]
): Promise<RegionStakedDEC> {
  const auth = await getAuthStatus();
  if (!auth.authenticated || !auth.username) return EMPTY_STAKED_DEC;
  if (enabledRegions.length === 0) return EMPTY_STAKED_DEC;

  const cookieStore = await cookies();
  const jwt = cookieStore.get("jwt_token")?.value ?? null;
  if (!jwt) return EMPTY_STAKED_DEC;

  const { regions, totalDecStaked } = await fetchProductionOverview(
    auth.username,
    jwt
  );
  const enabledSet = new Set(enabledRegions);

  // Required is summed across ALL regions so it lines up with the global
  // `totalDecStaked` pool, regardless of which regions are enabled in the tool.
  const totalRequired = regions.reduce(
    (sum, r) => sum + r.dark_energy_required,
    0
  );

  const enabled = regions
    .filter((r) => enabledSet.has(r.region_number))
    .map((r) => ({
      region_number: r.region_number,
      region_uid: r.region_uid,
      total_plot_count: r.plots_owned,
      dec_stake_needed: r.dark_energy_required,
      dec_stake_in_use: r.dark_energy_staked,
    }))
    .sort((a, b) => a.region_number - b.region_number);

  return { regions: enabled, totalStaked: totalDecStaked, totalRequired };
}

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
      stake_plot: c.stake_plot as number,
      stake_region: c.stake_region ?? null,
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
  const eligibility = await getRentalEligibility(enabledRegions);
  const plan = await buildRentalPlan(eligibility.eligible, rental);

  // Only fetch staked assets for plots that actually have picks to stake.
  const deedsToFetch = plan.items
    .filter((i) => i.picks.length > 0)
    .map((i) => i.plot);

  const emptySlotsByDeed: Record<string, number[]> = {};
  const limit = pLimit(5);

  await Promise.all(
    deedsToFetch.map((plot) =>
      limit(async () => {
        try {
          const assets: StakedAssets | undefined = await fetchStakedAssets(
            plot.deed_uid
          );
          const occupied = new Set<number>(
            (assets?.cards ?? []).map((c: Card) => c.slot)
          );
          const all = Array.from({ length: plot.max_workers }, (_, i) => i + 1);
          emptySlotsByDeed[plot.deed_uid] = all.filter((s) => !occupied.has(s));
        } catch {
          // Fall back to "no slot info" — execution layer will skip this deed.
          emptySlotsByDeed[plot.deed_uid] = [];
        }
      })
    )
  );

  return { plan, emptySlotsByDeed };
}
