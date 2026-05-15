import {
  fetchMarketForRentGrouped,
  fetchMarketRentalListings,
  fetchSettings,
} from "@/lib/backend/api/spl/spl-base-api";
import logger from "@/lib/backend/log/logger.server";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { BiomeKey, biomeKeyForCardColor } from "@/lib/shared/biomeUtils";
import { findCardSet, getCardImgV2 } from "@/lib/utils/cardUtil";
import {
  CardFoil,
  cardFoilOptions,
  CardRarity,
  cardRarityOptions,
} from "@/types/planner";
import {
  RentalConfig,
  RentalEligiblePlot,
  RentalPlan,
  RentalPlanItem,
  RentalPlanPick,
} from "@/types/landManager";
import {
  SplMarketListing,
  SplMarketRentGrouped,
} from "@/types/spl/marketRental";
import { SplCardDetails } from "@/types/splCardDetails";
import { calcLandPpPerBcx } from "@/lib/frontend/utils/plannerCalcs";

// ──────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;
// How many cheapest grouped tuples to keep as candidates (per biome).
const MAX_GROUPED_CANDIDATES_PER_BIOME = 15;

/**
 * Exact land PP per BCX for a grouped candidate, derived from the same formula
 * the planner uses (set modifier × foil modifier × basePPMax/maxBCX).
 * Returns null if any of (rarity, foil, set) can't be resolved.
 */
function ppPerBcxForGrouped(
  g: SplMarketRentGrouped,
  card: SplCardDetails,
  cardDetails: SplCardDetails[]
): number | null {
  const rarity = cardRarityOptions[card.rarity - 1] as CardRarity | undefined;
  const foil = cardFoilOptions[g.foil] as CardFoil | undefined;
  if (!rarity || !foil) return null;
  const set = findCardSet(cardDetails, g.card_detail_id, g.edition);
  if (!set) return null;
  return calcLandPpPerBcx(set, rarity, foil);
}

/**
 * Estimated land_base_pp for a grouped candidate. All listings in a group
 * share (cdid, foil, edition, level) so they share the same BCX → same PP.
 * Returns null when rarity/foil/set can't be resolved.
 */
function estimatedLandBasePp(
  g: SplMarketRentGrouped,
  card: SplCardDetails,
  cardDetails: SplCardDetails[]
): number | null {
  const bcx = Math.round(g.low_price / g.low_price_bcx);
  return (ppPerBcxForGrouped(g, card, cardDetails) ?? 0) * bcx;
}

// ──────────────────────────────────────────────────────────────────────────
// Types (internal)
// ──────────────────────────────────────────────────────────────────────────

interface CandidateTuple {
  card_detail_id: number;
  foil: number;
  edition: number;
  biomeKey: BiomeKey;
}

interface CandidateTuplesResult {
  tuples: CandidateTuple[];
  perBiome: Record<string, number>;
  groupedAfterColorFilter: number;
}

interface ScoredListing {
  listing: SplMarketListing;
  card: SplCardDetails;
  biomeKey: BiomeKey;
  total_dec: number;
  rental_days: number;
  land_base_pp: number;
}

interface PlotState {
  plot: RentalEligiblePlot;
  picks: RentalPlanPick[];
  plot_total_dec: number;
  skip_reason: string | null;
}

interface AssignmentResult {
  states: PlotState[];
  runningTotal: number;
}

// ──────────────────────────────────────────────────────────────────────────
// Small helpers
// ──────────────────────────────────────────────────────────────────────────

function foilString(foil: number): CardFoil {
  return cardFoilOptions[foil] ?? "regular";
}

function buildPick(
  scored: ScoredListing,
  biomeModifier: number
): RentalPlanPick {
  const { listing, card, total_dec, rental_days, land_base_pp } = scored;
  const effective_pp = land_base_pp * (1 + biomeModifier);
  return {
    market_id: listing.market_id,
    card_uid: listing.uid,
    card_detail_id: listing.card_detail_id,
    card_name: card.name,
    edition: listing.edition,
    foil: listing.foil,
    gold: listing.gold,
    level: listing.level,
    color: card.color,
    biome_modifier: biomeModifier,
    land_base_pp,
    effective_pp,
    buy_price_per_day: listing.buy_price,
    rental_days,
    total_dec,
    pp_per_dec: total_dec > 0 ? effective_pp / total_dec : 0,
    seller: listing.seller,
    expiration_date: listing.expiration_date,
    card_image_url: getCardImgV2(
      card.name,
      listing.edition,
      foilString(listing.foil),
      listing.level
    ),
  };
}

function emptyPlan(
  eligible: RentalEligiblePlot[],
  config: RentalConfig,
  items: RentalPlanItem[],
  warnings: string[],
  rental_days: number | null = null,
  rental_days_source = ""
): RentalPlan {
  return {
    config,
    items,
    totals: {
      plots_total: eligible.length,
      plots_with_picks: 0,
      slots_total: items.reduce((s, i) => s + i.plot.empty_slots, 0),
      slots_filled: 0,
      total_dec: 0,
    },
    warnings,
    rental_days,
    rental_days_source,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Phase 2 — build candidate tuples from grouped rentals
// ──────────────────────────────────────────────────────────────────────────

function buildCandidateTuples(
  grouped: SplMarketRentGrouped[],
  cardById: Map<number, SplCardDetails>,
  cardDetails: SplCardDetails[],
  maxPerWorkerPerDay: number,
  minLandBasePp: number
): CandidateTuplesResult {
  const tupleByKey = new Map<string, CandidateTuple>();
  const perBiome: Record<string, number> = {};
  let groupedAfterColorFilter = 0;

  // Best estimated PP-per-DEC first. PP/DEC = pp_per_bcx / (low_price_bcx × days);
  // for a fixed day count, max PP/DEC ≡ min (low_price_bcx / pp_per_bcx).
  // pp_per_bcx comes from the planner formula (set + foil + rarity).
  const rankScore = (g: SplMarketRentGrouped): number => {
    const card = cardById.get(g.card_detail_id);
    if (!card) return Number.POSITIVE_INFINITY;
    const ppPerBcx = ppPerBcxForGrouped(g, card, cardDetails);
    if (ppPerBcx === null || ppPerBcx <= 0) return Number.POSITIVE_INFINITY;
    return g.low_price_bcx / ppPerBcx;
  };
  const groupedSorted = [...grouped].sort(
    (a, b) => rankScore(a) - rankScore(b)
  );

  for (const g of groupedSorted) {
    const card = cardById.get(g.card_detail_id);
    if (!card) continue;
    const biomeKey = biomeKeyForCardColor(card.color);
    if (!biomeKey) continue; // neutral / unknown
    // Per-worker DEC/day cap: if even the cheapest listing of this group
    // exceeds the cap, no listings in it can ever be picked — skip before
    // making an API call.
    if (g.low_price > maxPerWorkerPerDay) continue;
    // Min land_base_pp: all listings in a group share level → share BCX → same
    // land_base_pp. Skip the group before fetching if it's below the floor.
    if (minLandBasePp > 0) {
      const estPp = estimatedLandBasePp(g, card, cardDetails);
      if (estPp === null || estPp < minLandBasePp) continue;
    }
    groupedAfterColorFilter += 1;

    if ((perBiome[biomeKey] ?? 0) >= MAX_GROUPED_CANDIDATES_PER_BIOME) continue;

    const key = `${g.card_detail_id}:${g.foil}:${g.edition}`;
    if (tupleByKey.has(key)) continue;
    perBiome[biomeKey] = (perBiome[biomeKey] ?? 0) + 1;
    tupleByKey.set(key, {
      card_detail_id: g.card_detail_id,
      foil: g.foil,
      edition: g.edition,
      biomeKey,
    });
  }

  // Preserve insertion order (already cheapest-first).
  return {
    tuples: [...tupleByKey.values()],
    perBiome,
    groupedAfterColorFilter,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Phase 3 — single season-info fetch + rental_days calc (7-day rule)
// ──────────────────────────────────────────────────────────────────────────

interface SeasonDaysResult {
  rental_days: number | null; // null when we should fall back to per-listing expiration
  source: string; // for diagnostics
}

async function computeRentalDaysForSeason(): Promise<SeasonDaysResult> {
  const settings = await fetchSettings();
  const current = settings?.season;
  if (!current?.ends) {
    return {
      rental_days: null,
      source: "fallback (settings missing season.ends)",
    };
  }

  const now = Date.now();
  const currentEndMs = new Date(current.ends).getTime();
  if (!Number.isFinite(currentEndMs)) {
    return {
      rental_days: null,
      source: `fallback (unparseable season.ends: ${current.ends})`,
    };
  }
  const daysToCurrentEnd = (currentEndMs - now) / MS_PER_DAY;

  // Rule: ≥7 days left → rental ends at current season end.
  if (daysToCurrentEnd >= 7) {
    const rentalDays = Math.max(1, Math.ceil(daysToCurrentEnd));
    return {
      rental_days: rentalDays,
      source: `season ${current.id} ends ${current.ends} (${daysToCurrentEnd.toFixed(2)}d left)`,
    };
  }

  // <7 days — rolls into next season. /settings exposes the next season end
  // directly at the top level, no extra call needed.
  const nextEndIso = settings?.next_season_end;
  if (!nextEndIso) {
    return {
      rental_days: null,
      source: "fallback (settings missing next_season_end)",
    };
  }
  const nextEndMs = new Date(nextEndIso).getTime();
  if (!Number.isFinite(nextEndMs) || nextEndMs <= currentEndMs) {
    return {
      rental_days: null,
      source: `fallback (unparseable next_season_end: ${nextEndIso})`,
    };
  }
  const rentalDays = Math.max(1, Math.ceil((nextEndMs - now) / MS_PER_DAY));
  return {
    rental_days: rentalDays,
    source: `next season end ${nextEndIso} (current ends ${current.ends}, ${daysToCurrentEnd.toFixed(2)}d left)`,
  };
}

function rentalDaysFromListing(
  listing: SplMarketListing,
  fallbackDays: number | null
): number {
  if (fallbackDays !== null) return fallbackDays;
  const expMs = new Date(listing.expiration_date).getTime();
  if (!Number.isFinite(expMs)) return 0;
  const diff = expMs - Date.now();
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / MS_PER_DAY));
}

function scoreListing(
  listing: SplMarketListing,
  card: SplCardDetails,
  biomeKey: BiomeKey,
  rentalDays: number,
  minLandBasePp: number
): ScoredListing | null {
  if (rentalDays <= 0) return null;
  const land_base_pp = Number(listing.land_base_pp);
  if (!Number.isFinite(land_base_pp) || land_base_pp <= 0) return null;
  // Per-listing PP guard. Needed in addition to the grouped pre-filter because
  // market_query_by_card returns ALL levels for (cdid, foil, edition) and a
  // tuple keyed on those three can be added by a high-level group, then a
  // low-level listing of the same card slips through the response.
  if (minLandBasePp > 0 && land_base_pp < minLandBasePp) return null;
  const total_dec = listing.buy_price * rentalDays;
  if (total_dec <= 0) return null;
  return {
    listing,
    card,
    biomeKey,
    total_dec,
    rental_days: rentalDays,
    land_base_pp,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Phase 4 — lazy fetch + greedy plot assignment
// ──────────────────────────────────────────────────────────────────────────

function findBestPlotForListing(
  scored: ScoredListing,
  states: PlotState[],
  remainingSlots: Map<string, number>
): PlotState | null {
  let best: PlotState | null = null;
  let bestModifier = -Infinity;
  let bestRemaining = -1;
  for (const state of states) {
    const remaining = remainingSlots.get(state.plot.deed_uid) ?? 0;
    if (remaining <= 0) continue;
    const mod = state.plot.biome_modifiers[scored.biomeKey];
    if (mod <= 0) continue; // plot does not benefit from this card's biome
    // Primary: highest biome modifier (give best card to plot that benefits most).
    // Tiebreak: plot with more empty slots (spreads picks evenly across plots).
    if (
      mod > bestModifier ||
      (mod === bestModifier && remaining > bestRemaining)
    ) {
      bestModifier = mod;
      bestRemaining = remaining;
      best = state;
    }
  }
  return best;
}

function allPlotsFull(remainingSlots: Map<string, number>): boolean {
  for (const r of remainingSlots.values()) if (r > 0) return false;
  return true;
}

async function fetchAndAssignLazy(
  tuples: CandidateTuple[],
  eligible: RentalEligiblePlot[],
  cardById: Map<number, SplCardDetails>,
  config: RentalConfig,
  rentalDaysFixed: number | null,
  warnings: string[]
): Promise<AssignmentResult> {
  const states: PlotState[] = eligible.map((plot) => ({
    plot,
    picks: [],
    plot_total_dec: 0,
    skip_reason: null,
  }));
  const remainingSlots = new Map<string, number>();
  for (const plot of eligible) {
    remainingSlots.set(plot.deed_uid, plot.empty_slots);
  }

  // Shopping cart — never pick the same card twice across plots, even via
  // different listings.
  const pickedCardUids = new Set<string>();

  const maxTotalDec =
    config.max_total_dec > 0 ? config.max_total_dec : Infinity;
  const maxPerWorkerPerDay =
    config.max_dec_per_day_per_worker > 0
      ? config.max_dec_per_day_per_worker
      : Infinity;

  let runningTotal = 0;

  for (const tuple of tuples) {
    if (allPlotsFull(remainingSlots)) break;

    const card = cardById.get(tuple.card_detail_id);
    if (!card) continue;

    let listings: SplMarketListing[];
    try {
      listings = await fetchMarketRentalListings(
        tuple.card_detail_id,
        tuple.foil,
        tuple.edition
      );
    } catch (err) {
      warnings.push(
        `Failed to fetch listings for ${card.name} (id ${tuple.card_detail_id}): ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      continue;
    }

    // Score + filter listings, then rank by PP/DEC. For regular foil this
    // equals cheapest-per-day, but gold / black foil have different
    // BCX-to-PP ratios so the explicit ratio is the right primary sort.
    const scoredList: ScoredListing[] = [];
    for (const listing of listings) {
      if (pickedCardUids.has(listing.uid)) continue;
      if (listing.buy_price > maxPerWorkerPerDay) continue;
      const rentalDays = rentalDaysFromListing(listing, rentalDaysFixed);
      const scored = scoreListing(
        listing,
        card,
        tuple.biomeKey,
        rentalDays,
        config.min_land_base_pp
      );
      if (!scored) continue;
      scoredList.push(scored);
    }
    scoredList.sort(
      (a, b) =>
        b.land_base_pp / b.listing.buy_price -
        a.land_base_pp / a.listing.buy_price
    );

    for (const scored of scoredList) {
      if (allPlotsFull(remainingSlots)) break;
      if (pickedCardUids.has(scored.listing.uid)) continue;
      // Total-DEC budget check (absolute, factoring rental_days via total_dec).
      if (runningTotal + scored.total_dec > maxTotalDec) continue;

      const target = findBestPlotForListing(scored, states, remainingSlots);
      if (!target) continue;

      const mod = target.plot.biome_modifiers[scored.biomeKey];
      target.picks.push(buildPick(scored, mod));
      target.plot_total_dec += scored.total_dec;
      remainingSlots.set(
        target.plot.deed_uid,
        (remainingSlots.get(target.plot.deed_uid) ?? 0) - 1
      );
      pickedCardUids.add(scored.listing.uid);
      runningTotal += scored.total_dec;
    }
  }

  // Annotate skip reasons after the loop.
  for (const state of states) {
    const remaining = remainingSlots.get(state.plot.deed_uid) ?? 0;
    if (remaining > 0 && state.picks.length === 0) {
      state.skip_reason = "no matching listings or budget exhausted";
    } else if (remaining > 0) {
      state.skip_reason = "could not fill all slots (budget or biome match)";
    }
  }

  return { states, runningTotal };
}

// ──────────────────────────────────────────────────────────────────────────
// Orchestrator
// ──────────────────────────────────────────────────────────────────────────

export async function buildRentalPlan(
  eligible: RentalEligiblePlot[],
  config: RentalConfig
): Promise<RentalPlan> {
  const warnings: string[] = [];
  const items: RentalPlanItem[] = eligible.map((plot) => ({
    plot,
    picks: [],
    slots_filled: 0,
    slots_skipped: plot.empty_slots,
    plot_total_dec: 0,
    skip_reason: null,
  }));

  if (eligible.length === 0) {
    return emptyPlan(eligible, config, items, warnings);
  }

  // ── Phase 1: card details ──
  const cardDetails = await getCachedCardDetailsData();
  const cardById = new Map(cardDetails.map((c) => [c.id, c]));

  // ── Phase 2: grouped rentals → candidate tuples ──
  const grouped = await fetchMarketForRentGrouped();
  logger.info(`[rental] grouped rentals from market: ${grouped.length}`);

  const maxDECPerWorkerPerDay =
    config.max_dec_per_day_per_worker > 0
      ? config.max_dec_per_day_per_worker
      : Infinity;
  const cands = buildCandidateTuples(
    grouped,
    cardById,
    cardDetails,
    maxDECPerWorkerPerDay,
    config.min_land_base_pp
  );
  logger.info(
    `[rental] biome-mappable: ${cands.groupedAfterColorFilter}; unique tuples: ${cands.tuples.length}; per biome: ${JSON.stringify(cands.perBiome)}`
  );

  if (cands.tuples.length === 0) {
    warnings.push(
      `No grouped rentals could be mapped to a known biome color out of ${grouped.length} grouped entries.`
    );
    return emptyPlan(eligible, config, items, warnings);
  }

  // ── Phase 3: fetch current-season info once ──
  const seasonDays = await computeRentalDaysForSeason();
  logger.info(
    `[rental] rental_days for run: ${seasonDays.rental_days ?? "(per-listing fallback)"} — source: ${seasonDays.source}`
  );
  if (seasonDays.rental_days === null) {
    warnings.push(
      `Could not determine season end from /settings — using each listing's expiration_date instead (${seasonDays.source}).`
    );
  }

  // ── Phase 4: lazy fetch + greedy assignment ──
  const result = await fetchAndAssignLazy(
    cands.tuples,
    eligible,
    cardById,
    config,
    seasonDays.rental_days,
    warnings
  );

  // Merge plot states back into items.
  const stateByDeed = new Map(result.states.map((s) => [s.plot.deed_uid, s]));
  for (const item of items) {
    const state = stateByDeed.get(item.plot.deed_uid);
    if (!state) continue;
    item.picks = state.picks;
    item.plot_total_dec = state.plot_total_dec;
    item.slots_filled = state.picks.length;
    item.slots_skipped = item.plot.empty_slots - state.picks.length;
    item.skip_reason = state.skip_reason;
  }

  const totals = {
    plots_total: eligible.length,
    plots_with_picks: items.filter((i) => i.picks.length > 0).length,
    slots_total: items.reduce((s, i) => s + i.plot.empty_slots, 0),
    slots_filled: items.reduce((s, i) => s + i.slots_filled, 0),
    total_dec: result.runningTotal,
  };

  return {
    config,
    items,
    totals,
    warnings,
    rental_days: seasonDays.rental_days,
    rental_days_source: seasonDays.source,
  };
}
