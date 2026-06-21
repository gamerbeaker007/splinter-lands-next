import logger from "@/lib/backend/log/logger.server";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { calcLandPpPerBcx } from "@/lib/frontend/utils/plannerCalcs";
import {
  determineCardMaxBCX,
  findCardElement,
  findCardSet,
  getCardImgV2,
} from "@/lib/utils/cardUtil";
import {
  WorkerEligiblePlot,
  WorkerPlanItem,
  WorkerPlanPick,
  WorkerPlanTotals,
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
  SplMarketListingGrouped,
} from "@/types/spl/marketListing";
import { SplCardDetails } from "@/types/splCardDetails";

/**
 * Shared planner for assigning market cards ("workers") to empty worker slots,
 * used by both the rental and buy flows. The only differences between the two
 * are which market endpoints to hit and how a listing is priced — captured by
 * {@link WorkerPlanStrategy}. Everything else (candidate selection, greedy
 * best-value assignment, batching) is identical.
 */

/**
 * How many unique (card_detail_id, foil, edition) tuples to fetch listings
 * for. Ranked globally across all eligible plots — no per-element cap — so the
 * best value always wins regardless of card colour.
 */
const MAX_CANDIDATE_TUPLES = 15;

// ── Grouped PP helpers (same formulas the planner uses) ───────────────────────

function ppPerBcxForGrouped(
  g: SplMarketListingGrouped,
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
 */
function estimatedLandBasePp(
  g: SplMarketListingGrouped,
  card: SplCardDetails,
  cardDetails: SplCardDetails[]
): number | null {
  const bcx = Math.round(g.low_price / g.low_price_bcx);
  return (ppPerBcxForGrouped(g, card, cardDetails) ?? 0) * bcx;
}

function foilString(foil: number): CardFoil {
  return cardFoilOptions[foil] ?? "regular";
}

// ── Strategy seam ─────────────────────────────────────────────────────────

/** Numeric caps derived from a flow's config. 0 = no limit; batchSize null = all plots. */
export interface PlanCaps {
  batchSize: number | null;
  maxTotalDec: number;
  maxPerWorker: number;
  minLandBasePp: number;
  minFoil: number;
}

/** Cost of a single listing, plus the rental-only fields when applicable. */
export interface ListingPricing {
  total_dec: number;
  buy_price_per_day?: number;
  rental_days?: number;
  expiration_date?: string;
}

/**
 * The per-flow differences. `Ctx` is the run-once context (e.g. season days
 * for rentals) produced by {@link prepare} and threaded into {@link priceListing}.
 */
export interface WorkerPlanStrategy<Ctx> {
  /** Log tag, e.g. "rental" / "buy". */
  label: string;
  fetchGrouped(): Promise<SplMarketListingGrouped[]>;
  fetchListings(
    cardDetailId: number,
    foil: number,
    edition: number
  ): Promise<SplMarketListing[]>;
  /** Run-once setup shared by all listings; may push warnings. */
  prepare(warnings: string[]): Promise<Ctx>;
  /** Price one listing; return null to skip it. */
  priceListing(listing: SplMarketListing, ctx: Ctx): ListingPricing | null;
}

// ── Internal types ──────────────────────────────────────────────────────────

interface CandidateTuple {
  card_detail_id: number;
  foil: number;
  edition: number;
  element: CardElement;
}

interface ScoredPair {
  listing: SplMarketListing;
  card: SplCardDetails;
  element: CardElement;
  plot: WorkerEligiblePlot;
  biomeModifier: number;
  land_base_pp: number;
  effective_pp: number;
  pricing: ListingPricing;
  /** effective_pp / total_dec — the primary ranking metric. */
  effectivePpPerDec: number;
}

export interface WorkerPlanBase {
  items: WorkerPlanItem[];
  totals: WorkerPlanTotals;
  warnings: string[];
}

// ── Pieces ────────────────────────────────────────────────────────────────

function buildPick(
  pair: ScoredPair,
  cardDetails: SplCardDetails[]
): WorkerPlanPick {
  const { listing, card, biomeModifier, land_base_pp, effective_pp, pricing } =
    pair;
  const rarity = cardRarityOptions[card.rarity - 1] as CardRarity;
  const set = findCardSet(cardDetails, listing.card_detail_id, listing.edition);
  const maxBcx = determineCardMaxBCX(set, rarity, listing.foil);
  const total_dec = pricing.total_dec;

  return {
    market_id: listing.market_id,
    card_uid: listing.uid,
    card_detail_id: listing.card_detail_id,
    card_name: card.name,
    edition: listing.edition,
    rarity,
    bcx: listing.bcx,
    max_bcx: maxBcx,
    foil: listing.foil,
    gold: listing.gold,
    level: listing.level,
    color: card.color,
    biome_modifier: biomeModifier,
    land_base_pp,
    effective_pp,
    total_dec,
    pp_per_dec: total_dec > 0 ? effective_pp / total_dec : 0,
    seller: listing.seller,
    card_image_url: getCardImgV2(
      card.name,
      listing.edition,
      foilString(listing.foil),
      listing.level
    ),
    // Rental-only fields — undefined for purchases.
    buy_price_per_day: pricing.buy_price_per_day,
    rental_days: pricing.rental_days,
    expiration_date: pricing.expiration_date,
  };
}

function totalsFor(
  plots: WorkerEligiblePlot[],
  items: WorkerPlanItem[]
): WorkerPlanTotals {
  return {
    plots_total: plots.length,
    plots_with_picks: items.filter((i) => i.picks.length > 0).length,
    slots_total: items.reduce((s, i) => s + i.plot.empty_slots, 0),
    slots_filled: items.reduce((s, i) => s + i.slots_filled, 0),
    total_dec: items.reduce((s, i) => s + i.plot_total_dec, 0),
  };
}

/**
 * Scores every grouped-market entry against all eligible plots and returns the
 * top MAX_CANDIDATE_TUPLES unique (card, foil, edition) tuples ranked by the
 * best achievable effective_pp/DEC on any available plot. No per-element cap.
 */
function selectCandidateTuples(
  grouped: SplMarketListingGrouped[],
  cardById: Map<number, SplCardDetails>,
  cardDetails: SplCardDetails[],
  eligible: WorkerEligiblePlot[],
  maxPerWorker: number,
  minLandBasePp: number,
  minFoil: number,
  label: string
): CandidateTuple[] {
  const seen = new Set<string>();
  const scored: { tuple: CandidateTuple; score: number }[] = [];

  for (const g of grouped) {
    const card = cardById.get(g.card_detail_id);
    if (!card) continue;
    if (g.foil < minFoil) continue;
    if (g.low_price > maxPerWorker) continue;

    const key = `${g.card_detail_id}:${g.foil}:${g.edition}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const element = findCardElement(cardDetails, g.card_detail_id);
    const estPp = estimatedLandBasePp(g, card, cardDetails);
    if (!estPp || estPp <= 0) continue;
    if (minLandBasePp > 0 && estPp < minLandBasePp) continue;

    // Best achievable score across any eligible plot. rental_days cancels out
    // in the comparison so we divide by g.low_price rather than total cost.
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
    `[${label}] candidates: ${top.length} tuples from ${scored.length} eligible groups`
  );
  return top.map((s) => s.tuple);
}

/**
 * For every candidate tuple, fetches live listings and pairs each valid listing
 * with every eligible plot that doesn't penalise the card's element. Returns a
 * flat list sorted best-first (highest effectivePpPerDec).
 */
async function buildScoredPairs<Ctx>(
  tuples: CandidateTuple[],
  eligible: WorkerEligiblePlot[],
  cardById: Map<number, SplCardDetails>,
  caps: PlanCaps,
  maxPerWorker: number,
  strategy: WorkerPlanStrategy<Ctx>,
  ctx: Ctx,
  warnings: string[]
): Promise<ScoredPair[]> {
  const pairs: ScoredPair[] = [];

  for (const tuple of tuples) {
    const card = cardById.get(tuple.card_detail_id);
    if (!card) continue;

    let listings: SplMarketListing[];
    try {
      listings = await strategy.fetchListings(
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
      if (listing.buy_price > maxPerWorker) continue;

      // land_base_pp comes from the actual listing, not an estimate, so this
      // correctly rejects below-threshold low-level cards.
      const land_base_pp = Number(listing.land_base_pp);
      if (!Number.isFinite(land_base_pp) || land_base_pp <= 0) continue;
      if (caps.minLandBasePp > 0 && land_base_pp < caps.minLandBasePp) continue;

      const pricing = strategy.priceListing(listing, ctx);
      if (!pricing || pricing.total_dec <= 0) continue;

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
          pricing,
          effectivePpPerDec: effective_pp / pricing.total_dec,
        });
      }
    }
  }

  pairs.sort((a, b) => b.effectivePpPerDec - a.effectivePpPerDec);
  logger.info(`[${strategy.label}] scored pairs: ${pairs.length}`);
  return pairs;
}

/**
 * Greedy assignment from the globally sorted pair list (best value first). A
 * pair is assigned when the listing hasn't been picked, the plot still has an
 * empty slot, and it stays within the total DEC budget.
 */
function greedyAssign(
  cardDetails: SplCardDetails[],
  pairs: ScoredPair[],
  eligible: WorkerEligiblePlot[],
  maxTotalDec: number
): Map<string, WorkerPlanPick[]> {
  const remainingSlots = new Map(
    eligible.map((p) => [p.deed_uid, p.empty_slots])
  );
  const pickedCards = new Set<string>();
  const picksByDeed = new Map(
    eligible.map((p) => [p.deed_uid, [] as WorkerPlanPick[]])
  );
  let runningTotal = 0;

  for (const pair of pairs) {
    if (pickedCards.has(pair.listing.uid)) continue;
    const remaining = remainingSlots.get(pair.plot.deed_uid) ?? 0;
    if (remaining <= 0) continue;
    if (runningTotal + pair.pricing.total_dec > maxTotalDec) continue;

    picksByDeed.get(pair.plot.deed_uid)!.push(buildPick(pair, cardDetails));
    remainingSlots.set(pair.plot.deed_uid, remaining - 1);
    pickedCards.add(pair.listing.uid);
    runningTotal += pair.pricing.total_dec;
  }

  return picksByDeed;
}

// ── Orchestrator ────────────────────────────────────────────────────────────

/**
 * Builds a worker plan for the given eligible plots and caps using the
 * supplied strategy. Returns the shared plan fields plus the prepared context
 * (e.g. season days) so callers can attach flow-specific extras. `ctx` is null
 * when the run short-circuits before {@link WorkerPlanStrategy.prepare} runs.
 */
export async function buildWorkerPlan<Ctx>(
  eligible: WorkerEligiblePlot[],
  caps: PlanCaps,
  strategy: WorkerPlanStrategy<Ctx>
): Promise<WorkerPlanBase & { ctx: Ctx | null }> {
  const warnings: string[] = [];

  // Apply batch size cap (null / <= 0 = all plots).
  let batched = eligible;
  if (caps.batchSize !== null && caps.batchSize > 0) {
    batched = eligible.slice(0, caps.batchSize);
    if (batched.length < eligible.length) {
      warnings.push(
        `Batch size ${caps.batchSize}: processing first ${batched.length} of ${eligible.length} eligible plots this run.`
      );
    }
  }

  const items: WorkerPlanItem[] = batched.map((plot) => ({
    plot,
    picks: [],
    slots_filled: 0,
    slots_skipped: plot.empty_slots,
    plot_total_dec: 0,
    skip_reason: null,
  }));

  const empty = (ctx: Ctx | null): WorkerPlanBase & { ctx: Ctx | null } => ({
    items,
    totals: totalsFor(eligible, items),
    warnings,
    ctx,
  });

  if (batched.length === 0) return empty(null);

  const cardDetails = await getCachedCardDetailsData();
  const cardById = new Map(cardDetails.map((c) => [c.id, c]));

  const grouped = await strategy.fetchGrouped();
  logger.info(`[${strategy.label}] grouped market entries: ${grouped.length}`);

  const maxPerWorker = caps.maxPerWorker > 0 ? caps.maxPerWorker : Infinity;
  const maxTotalDec = caps.maxTotalDec > 0 ? caps.maxTotalDec : Infinity;

  const tuples = selectCandidateTuples(
    grouped,
    cardById,
    cardDetails,
    batched,
    maxPerWorker,
    caps.minLandBasePp,
    caps.minFoil,
    strategy.label
  );
  if (tuples.length === 0) {
    warnings.push(
      `No candidate tuples found after filtering ${grouped.length} grouped market entries.`
    );
    return empty(null);
  }

  const ctx = await strategy.prepare(warnings);

  const pairs = await buildScoredPairs(
    tuples,
    batched,
    cardById,
    caps,
    maxPerWorker,
    strategy,
    ctx,
    warnings
  );
  if (pairs.length === 0) {
    warnings.push(
      "No valid (listing, plot) pairs found — market may be empty or all listings filtered out."
    );
    return empty(ctx);
  }

  const picksByDeed = greedyAssign(cardDetails, pairs, batched, maxTotalDec);

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

  return { items, totals: totalsFor(batched, items), warnings, ctx };
}
