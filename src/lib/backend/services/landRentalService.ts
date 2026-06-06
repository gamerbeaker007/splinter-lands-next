import {
  fetchMarketForRentGrouped,
  fetchMarketRentalListings,
  fetchSettings,
} from "@/lib/backend/api/spl/spl-base-api";
import logger from "@/lib/backend/log/logger.server";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { calcLandPpPerBcx } from "@/lib/frontend/utils/plannerCalcs";
import {
  findCardElement,
  findCardSet,
  getCardImgV2,
} from "@/lib/utils/cardUtil";
import {
  RentalConfig,
  RentalEligiblePlot,
  RentalPlan,
  RentalPlanItem,
  RentalPlanPick,
} from "@/types/landManager";
import {
  CardElement,
  CardFoil,
  cardFoilOptions,
  CardRarity,
  cardRarityOptions,
} from "@/types/planner";
import {
  SplMarketListing,
  SplMarketRentGrouped,
} from "@/types/spl/marketRental";
import { SplCardDetails } from "@/types/splCardDetails";

// Constants

const MS_PER_DAY = 86_400_000;

/**
 * How many unique (card_detail_id, foil, edition) tuples to fetch listings
 * for. They are ranked globally across all eligible plots - no per-element
 * cap - so the best value always wins regardless of card colour.
 * Higher = more choices but one extra API call per extra tuple.
 */
const MAX_CANDIDATE_TUPLES = 100;

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
 * share (cdid, foil, edition, level) so they share the same BCX â†’ same PP.
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

// Types
/** A unique (card, foil variant, edition) combination from the grouped market. */
interface CandidateTuple {
  card_detail_id: number;
  foil: number;
  edition: number;
  element: CardElement;
}

/**
 * A single rental listing paired with a specific eligible plot, scored by
 * effective_pp / total_dec. Building a flat global list and sorting it once
 * means greedy assignment always picks the best available value - no per-plot
 * or per-element inner loops needed.
 */
interface ScoredPair {
  listing: SplMarketListing;
  card: SplCardDetails;
  element: CardElement;
  plot: RentalEligiblePlot;
  biomeModifier: number;
  land_base_pp: number;
  effective_pp: number;
  rental_days: number;
  total_dec: number;
  /** effective_pp / total_dec - the primary ranking metric. */
  effectivePpPerDec: number;
}

// Small helpers
function foilString(foil: number): CardFoil {
  return cardFoilOptions[foil] ?? "regular";
}

function buildPick(pair: ScoredPair): RentalPlanPick {
  const {
    listing,
    card,
    biomeModifier,
    land_base_pp,
    effective_pp,
    rental_days,
    total_dec,
  } = pair;
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
// Season / rental-days helpers
// ──────────────────────────────────────────────────────────────────────────

interface SeasonDaysResult {
  rental_days: number | null; // null → fall back to per-listing expiration_date
  source: string;
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
  if (daysToCurrentEnd >= 7) {
    const rentalDays = Math.max(1, Math.ceil(daysToCurrentEnd));
    return {
      rental_days: rentalDays,
      source: `season ${current.id} ends ${current.ends} (${daysToCurrentEnd.toFixed(2)}d left)`,
    };
  }
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

// Phase 1 - score all groups globally, pick top candidate tuples

/**
 * Scores every grouped-market entry against all eligible plots and returns
 * the top MAX_CANDIDATE_TUPLES unique (card, foil, edition) tuples ranked by
 * the best achievable effective_pp/DEC/day on any available plot.
 *
 * No per-element cap: fire and water cards compete on the same global
 * leaderboard - the best value wins regardless of element.
 */
function selectCandidateTuples(
  rentalMarketGrouped: SplMarketRentGrouped[],
  cardById: Map<number, SplCardDetails>,
  cardDetails: SplCardDetails[],
  eligible: RentalEligiblePlot[],
  maxPerWorkerPerDay: number,
  minLandBasePp: number,
  minFoil: number
): CandidateTuple[] {
  const seen = new Set<string>();
  const scored: { tuple: CandidateTuple; score: number }[] = [];

  for (const g of rentalMarketGrouped) {
    const card = cardById.get(g.card_detail_id);
    if (!card) continue;
    if (g.foil < minFoil) continue;
    if (g.low_price > maxPerWorkerPerDay) continue;

    const key = `${g.card_detail_id}:${g.foil}:${g.edition}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const element = findCardElement(cardDetails, g.card_detail_id);
    const estPp = estimatedLandBasePp(g, card, cardDetails);
    if (!estPp || estPp <= 0) continue;
    if (minLandBasePp > 0 && estPp < minLandBasePp) continue;

    // Best achievable score = max (estimated_pp — (1 + biome_mod)) / DEC/day
    // across any eligible plot. rental_days cancels out in the comparison so
    // we divide by g.low_price (DEC/day) rather than total_dec.
    let bestScore = 0;
    for (const plot of eligible) {
      const mod = plot.biome_modifiers[element] ?? 0;
      if (mod < 0) continue; // element is penalised on this plot
      const score = (estPp * (1 + mod)) / g.low_price;
      if (score > bestScore) bestScore = score;
    }
    if (bestScore <= 0) continue;

    scored.push({
      tuple: {
        card_detail_id: g.card_detail_id,
        foil: g.foil,
        edition: g.edition,
        element,
      },
      score: bestScore,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, MAX_CANDIDATE_TUPLES);

  logger.info(
    `[rental] candidates: ${top.length} tuples from ${scored.length} eligible groups` +
      ` (best score: ${top[0]?.score.toFixed(2) ?? "n/a"},` +
      ` worst: ${top.at(-1)?.score.toFixed(2) ?? "n/a"})`
  );
  return top.map((s) => s.tuple);
}

// Phase 2 fetch actual listings, cross-product with plots, score each pair

/**
 * For every candidate tuple, fetches live listings from the market and pairs
 * each valid listing with every eligible plot that doesn't penalise the card's
 * element. Returns a flat list sorted best-first (highest effectivePpPerDec).
 */
async function buildScoredPairs(
  tuples: CandidateTuple[],
  eligible: RentalEligiblePlot[],
  cardById: Map<number, SplCardDetails>,
  rentalDaysFixed: number | null,
  minLandBasePp: number,
  maxPerWorkerPerDay: number,
  warnings: string[]
): Promise<ScoredPair[]> {
  const pairs: ScoredPair[] = [];

  for (const tuple of tuples) {
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

    for (const listing of listings) {
      if (listing.buy_price > maxPerWorkerPerDay) continue;

      const rentalDays = rentalDaysFromListing(listing, rentalDaysFixed);
      if (rentalDays <= 0) continue;

      // land_base_pp comes from the actual listing, not an estimate, so this
      // guard correctly rejects below-threshold low-level cards even when a
      // high-level group of the same (cdid, foil, edition) was in the tuples.
      const land_base_pp = Number(listing.land_base_pp);
      if (!Number.isFinite(land_base_pp) || land_base_pp <= 0) continue;
      if (minLandBasePp > 0 && land_base_pp < minLandBasePp) continue;

      const total_dec = listing.buy_price * rentalDays;
      if (total_dec <= 0) continue;

      for (const plot of eligible) {
        const mod = plot.biome_modifiers[tuple.element] ?? 0;
        if (mod < 0) continue; // element is penalised on this plot
        const effective_pp = land_base_pp * (1 + mod);
        pairs.push({
          listing,
          card,
          element: tuple.element,
          plot,
          biomeModifier: mod,
          land_base_pp,
          effective_pp,
          rental_days: rentalDays,
          total_dec,
          effectivePpPerDec: effective_pp / total_dec,
        });
      }
    }
  }

  // Best value first greedy assignment reads from the top.
  pairs.sort((a, b) => b.effectivePpPerDec - a.effectivePpPerDec);
  logger.info(`[rental] scored pairs: ${pairs.length}`);
  return pairs;
}

// Phase 3 - greedy assignment from the globally sorted pair list
interface GreedyResult {
  picksByDeed: Map<string, RentalPlanPick[]>;
  runningTotal: number;
}

/**
 * Iterates the globally sorted pair list (best effectivePpPerDec first).
 * A pair is assigned when:
 *  - the listing hasn't been picked yet (no double-booking)
 *  - the target plot still has empty slots
 *  - the assignment stays within the total DEC budget
 */
function greedyAssign(
  pairs: ScoredPair[],
  eligible: RentalEligiblePlot[],
  config: RentalConfig
): GreedyResult {
  const remainingSlots = new Map(
    eligible.map((p) => [p.deed_uid, p.empty_slots])
  );
  const pickedCards = new Set<string>();
  const picksByDeed = new Map(
    eligible.map((p) => [p.deed_uid, [] as RentalPlanPick[]])
  );
  const maxTotalDec =
    config.max_total_dec > 0 ? config.max_total_dec : Infinity;
  let runningTotal = 0;

  for (const pair of pairs) {
    if (pickedCards.has(pair.listing.uid)) continue;
    const remaining = remainingSlots.get(pair.plot.deed_uid) ?? 0;
    if (remaining <= 0) continue;
    if (runningTotal + pair.total_dec > maxTotalDec) continue;

    picksByDeed.get(pair.plot.deed_uid)!.push(buildPick(pair));
    remainingSlots.set(pair.plot.deed_uid, remaining - 1);
    pickedCards.add(pair.listing.uid);
    runningTotal += pair.total_dec;
  }

  return { picksByDeed, runningTotal };
}

// Orchestrator
export async function buildRentalPlan(
  eligible: RentalEligiblePlot[],
  config: RentalConfig
): Promise<RentalPlan> {
  const warnings: string[] = [];

  // Apply batch size cap.
  let batchedEligible = eligible;
  if (config.rental_batch_size !== null && config.rental_batch_size > 0) {
    const cap = config.rental_batch_size;
    batchedEligible = eligible.slice(0, cap);
    if (batchedEligible.length < eligible.length) {
      warnings.push(
        `Batch size ${cap}: processing first ${batchedEligible.length} of ${eligible.length} eligible plots this run.`
      );
    }
  }

  const items: RentalPlanItem[] = batchedEligible.map((plot) => ({
    plot,
    picks: [],
    slots_filled: 0,
    slots_skipped: plot.empty_slots,
    plot_total_dec: 0,
    skip_reason: null,
  }));

  if (batchedEligible.length === 0) {
    return emptyPlan(eligible, config, items, warnings);
  }

  // Phase 1: card details (cached 1 day).
  const cardDetails = await getCachedCardDetailsData();
  const cardById = new Map(cardDetails.map((c) => [c.id, c]));

  // Phase 2: live grouped-market snapshot.
  const rentalMarketGrouped = await fetchMarketForRentGrouped();
  logger.info(`[rental] grouped market entries: ${rentalMarketGrouped.length}`);

  const maxPerWorkerPerDay =
    config.max_dec_per_day_per_worker > 0
      ? config.max_dec_per_day_per_worker
      : Infinity;

  // Phase 3: select top candidate tuples globally (no per-element cap).
  const tuples = selectCandidateTuples(
    rentalMarketGrouped,
    cardById,
    cardDetails,
    batchedEligible,
    maxPerWorkerPerDay,
    config.min_land_base_pp,
    config.min_foil
  );

  if (tuples.length === 0) {
    warnings.push(
      `No candidate tuples found after filtering ${rentalMarketGrouped.length} grouped market entries.`
    );
    return emptyPlan(eligible, config, items, warnings);
  }

  // Phase 4: season info (cached via fetchSettings).
  const seasonDays = await computeRentalDaysForSeason();
  logger.info(
    `[rental] rental_days: ${seasonDays.rental_days ?? "per-listing"} - ${seasonDays.source}`
  );
  if (seasonDays.rental_days === null) {
    warnings.push(
      `Could not determine season end from /settings - using each listing's expiration_date instead (${seasonDays.source}).`
    );
  }

  // Phase 5: fetch actual listings and score every (listing, plot) pair.
  const pairs = await buildScoredPairs(
    tuples,
    batchedEligible,
    cardById,
    seasonDays.rental_days,
    config.min_land_base_pp,
    maxPerWorkerPerDay,
    warnings
  );

  if (pairs.length === 0) {
    warnings.push(
      "No valid (listing, plot) pairs found market may be empty or all listings filtered out."
    );
    return emptyPlan(
      eligible,
      config,
      items,
      warnings,
      seasonDays.rental_days,
      seasonDays.source
    );
  }

  // Phase 6: greedy assignment (best PP/DEC first).
  const { picksByDeed, runningTotal } = greedyAssign(
    pairs,
    batchedEligible,
    config
  );

  // Merge picks into items.
  for (const item of items) {
    const picks = picksByDeed.get(item.plot.deed_uid) ?? [];
    item.picks = picks;
    item.slots_filled = picks.length;
    item.slots_skipped = item.plot.empty_slots - picks.length;
    item.plot_total_dec = picks.reduce((s, p) => s + p.total_dec, 0);
    if (item.slots_skipped > 0 && picks.length === 0) {
      item.skip_reason = "no matching listings or budget exhausted";
    } else if (item.slots_skipped > 0) {
      item.skip_reason =
        "could not fill all slots (budget or no matching pairs)";
    }
  }

  const totals = {
    plots_total: batchedEligible.length,
    plots_with_picks: items.filter((i) => i.picks.length > 0).length,
    slots_total: items.reduce((s, i) => s + i.plot.empty_slots, 0),
    slots_filled: items.reduce((s, i) => s + i.slots_filled, 0),
    total_dec: runningTotal,
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
