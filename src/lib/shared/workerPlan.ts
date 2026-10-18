import { calcLandPpPerBcx } from "@/lib/frontend/utils/plannerCalcs";
import {
  determineLandBoosts,
  determineCardMaxBCX,
  findCardElement,
  findCardSet,
  getCardImgV2,
} from "@/lib/utils/cardUtil";
import { cardElementColorMap } from "@/types/planner/primitives";
import {
  BuyConfig,
  BuyPlan,
  RentalConfig,
  RentalPlan,
  WorkerEligiblePlot,
  WorkerPlanItem,
  WorkerPlanPick,
  WorkerPlanPlotCard,
  WorkerPlanTotals,
  normalizeWorkerBatchSize,
} from "@/types/landManager";
import {
  CardBloodline,
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
import { SplSettingsResponse } from "@/types/spl/settings";
import { SplCardDetails } from "@/types/splCardDetails";

/**
 * Shared planner for assigning market cards ("workers") to empty worker slots,
 * used by both the rental and buy flows. The only differences between the two
 * are which market endpoints to hit and how a listing is priced — captured by
 * {@link WorkerPlanStrategy}. Everything else (candidate selection, greedy
 * best-value assignment, batching) is identical.
 *
 * Pure (no server imports) so the browser can run it: candidate selection
 * needs the shared grouped market + card details and runs where those are
 * cached (server, `loadCandidates`); the live per-card listings are fetched by
 * whoever runs the plan (`fetchListings` — the browser for the land manager).
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

/** Numeric caps derived from a flow's config. 0 = no spend limit; batches cap at 100 plots. */
export interface PlanCaps {
  batchSize: number | null;
  maxTotalDec: number;
  maxPerWorker: number;
  minLandBasePp: number;
  minFoil: number;
  requireTerrainBoost: boolean;
}

/** Cost of a single listing, plus the rental-only fields when applicable. */
export interface ListingPricing {
  total_dec: number;
  /** Cost compared with the flow's per-worker cap: DEC/day for rent, DEC for buy. */
  worker_cap_cost: number;
  total_usd?: number;
  buy_price_per_day?: number;
  rental_days?: number;
  expiration_date?: string;
}

/** The top candidate tuples plus the run-once context, from `loadCandidates`. */
export interface WorkerPlanCandidates<Ctx> {
  tuples: CandidateTuple[];
  /** Card details of the tuples' cards only (all the plan needs). */
  cards: SplCardDetails[];
  /** How many grouped market entries the candidates were picked from. */
  groupedCount: number;
  /** Null when there were no candidates (the context is not prepared then). */
  ctx: Ctx | null;
  warnings: string[];
}

/**
 * The per-flow differences. `Ctx` is the run-once context (e.g. season days
 * for rentals) produced alongside the candidates and threaded into
 * {@link priceListing}.
 */
export interface WorkerPlanStrategy<Ctx> {
  /** Log tag, e.g. "rental" / "buy". */
  label: string;
  /** Picks candidate tuples for the plots' biome modifiers (see selectCandidateTuples). */
  loadCandidates(
    biomeModifiers: PlotBiomeModifiers[],
    caps: PlanCaps
  ): Promise<WorkerPlanCandidates<Ctx>>;
  fetchListings(
    cardDetailId: number,
    foil: number,
    edition: number
  ): Promise<SplMarketListing[]>;
  /** Price one listing; return null to skip it. */
  priceListing(listing: SplMarketListing, ctx: Ctx): ListingPricing | null;
  log?: (message: string) => void;
}

export function isWithinWorkerCap(
  pricing: ListingPricing,
  maxPerWorker: number
): boolean {
  return maxPerWorker <= 0 || pricing.worker_cap_cost <= maxPerWorker;
}

/** The only per-plot input candidate selection needs. */
export type PlotBiomeModifiers = WorkerEligiblePlot["biome_modifiers"];

// ── Internal types ──────────────────────────────────────────────────────────

export interface CandidateTuple {
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
  const foil = foilString(listing.foil);
  const splCard = cardDetails.find((c) => c.id === listing.card_detail_id);
  const secondaryColor = splCard?.secondary_color?.toLowerCase();

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
    card_set: set,
    element: findCardElement(cardDetails, listing.card_detail_id),
    secondary_element: secondaryColor
      ? (cardElementColorMap[secondaryColor] ?? null)
      : null,
    bloodline: (card.sub_type ?? "Unknown") as CardBloodline,
    land_boosts:
      set === "land"
        ? determineLandBoosts(rarity, foil, listing.bcx, card)
        : undefined,
    biome_modifier: biomeModifier,
    land_base_pp,
    effective_pp,
    total_dec,
    total_usd: pricing.total_usd ?? 0,
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
export function selectCandidateTuples(
  grouped: SplMarketListingGrouped[],
  cardDetails: SplCardDetails[],
  biomeModifiers: PlotBiomeModifiers[],
  caps: PlanCaps,
  log?: (message: string) => void
): { tuples: CandidateTuple[]; cards: SplCardDetails[] } {
  const cardById = new Map(cardDetails.map((c) => [c.id, c]));
  const maxPerWorker = caps.maxPerWorker > 0 ? caps.maxPerWorker : Infinity;
  const { minLandBasePp, minFoil, requireTerrainBoost } = caps;
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
    for (const modifiers of biomeModifiers) {
      const mod = modifiers[element] ?? 0;
      if (requireTerrainBoost ? mod <= 0 : mod < 0) continue;
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
  log?.(
    `candidates: ${top.length} tuples from ${scored.length} eligible groups`
  );
  const tuples = top.map((s) => s.tuple);
  const ids = new Set(tuples.map((t) => t.card_detail_id));
  return { tuples, cards: cardDetails.filter((c) => ids.has(c.id)) };
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
      // land_base_pp comes from the actual listing, not an estimate, so this
      // correctly rejects below-threshold low-level cards.
      const land_base_pp = Number(listing.land_base_pp);
      if (!Number.isFinite(land_base_pp) || land_base_pp <= 0) continue;
      if (caps.minLandBasePp > 0 && land_base_pp < caps.minLandBasePp) continue;

      const pricing = strategy.priceListing(listing, ctx);
      if (!pricing || pricing.total_dec <= 0) continue;
      if (!isWithinWorkerCap(pricing, maxPerWorker)) continue;

      for (const plot of eligible) {
        const mod = plot.biome_modifiers[tuple.element] ?? 0;
        if (caps.requireTerrainBoost ? mod <= 0 : mod < 0) continue;
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
  strategy.log?.(`[${strategy.label}] scored pairs: ${pairs.length}`);
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
 * when the run short-circuits before any candidate was found.
 */
export async function buildWorkerPlan<Ctx>(
  eligible: WorkerEligiblePlot[],
  caps: PlanCaps,
  strategy: WorkerPlanStrategy<Ctx>
): Promise<WorkerPlanBase & { ctx: Ctx | null }> {
  const warnings: string[] = [];

  // Legacy null / non-positive and oversized values are capped at 100.
  const batchSize = normalizeWorkerBatchSize(caps.batchSize);
  const batched = eligible.slice(0, batchSize);
  if (batched.length < eligible.length) {
    warnings.push(
      `Batch size ${batchSize}: processing first ${batched.length} of ${eligible.length} eligible plots this run.`
    );
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
    totals: totalsFor(batched, items),
    warnings,
    ctx,
  });

  if (batched.length === 0) return empty(null);

  const maxPerWorker = caps.maxPerWorker > 0 ? caps.maxPerWorker : Infinity;
  const maxTotalDec = caps.maxTotalDec > 0 ? caps.maxTotalDec : Infinity;

  const candidates = await strategy.loadCandidates(
    batched.map((plot) => plot.biome_modifiers),
    caps
  );
  const { tuples, cards: cardDetails, ctx } = candidates;
  const cardById = new Map(cardDetails.map((c) => [c.id, c]));
  if (tuples.length === 0 || ctx === null) {
    warnings.push(
      `No candidate tuples found after filtering ${candidates.groupedCount} grouped market entries.`
    );
    return empty(null);
  }
  warnings.push(...candidates.warnings);

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

// ── Pricing (rental: DEC/day × rental_days; buy: one-time DEC price) ────────

const MS_PER_DAY = 86_400_000;

/** Rental-flow run-once context. */
export interface SeasonDaysResult {
  /** null → fall back to per-listing expiration_date. */
  rental_days: number | null;
  source: string;
  /** DEC/USD market price for estimated fiat cost display. */
  usd_per_dec?: number;
}

/**
 * Rental days to the current season end — or, with less than 7 days left, to
 * the next season end. null (per-listing expiry) when /settings lacks dates.
 */
export function rentalDaysForSeason(
  settings: SplSettingsResponse | null,
  now = Date.now()
): SeasonDaysResult {
  const current = settings?.season;
  if (!current?.ends) {
    return {
      rental_days: null,
      source: "fallback (settings missing season.ends)",
    };
  }
  const currentEndMs = new Date(current.ends).getTime();
  if (!Number.isFinite(currentEndMs)) {
    return {
      rental_days: null,
      source: `fallback (unparseable season.ends: ${current.ends})`,
    };
  }
  const daysToCurrentEnd = (currentEndMs - now) / MS_PER_DAY;
  if (daysToCurrentEnd >= 7) {
    return {
      rental_days: Math.max(1, Math.ceil(daysToCurrentEnd)),
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
  return {
    rental_days: Math.max(1, Math.ceil((nextEndMs - now) / MS_PER_DAY)),
    source: `next season end ${nextEndIso} (current ends ${current.ends}, ${daysToCurrentEnd.toFixed(2)}d left)`,
  };
}

/** Warning added to the plan when the season end could not be determined. */
export function seasonDaysWarnings(season: SeasonDaysResult): string[] {
  return season.rental_days === null
    ? [
        `Could not determine season end from /settings - using each listing's expiration_date instead (${season.source}).`,
      ]
    : [];
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

/** Season rentals: cost = DEC/day × rental_days. */
export function priceRentalListing(
  listing: SplMarketListing,
  season: SeasonDaysResult,
  usdPerDec = season.usd_per_dec ?? 0
): ListingPricing | null {
  const rentalDays = rentalDaysFromListing(listing, season.rental_days);
  if (rentalDays <= 0) return null;
  return {
    total_dec: listing.buy_price * rentalDays,
    worker_cap_cost: listing.buy_price,
    total_usd: listing.buy_price * rentalDays * usdPerDec,
    buy_price_per_day: listing.buy_price,
    rental_days: rentalDays,
    expiration_date: listing.expiration_date,
  };
}

/** Outright purchases: cost = one-time DEC price (`decPrice` = USD per DEC). */
export function priceBuyListing(
  listing: SplMarketListing,
  decPrice: number
): ListingPricing | null {
  if (listing.currency == "USD") {
    return {
      total_dec: listing.buy_price / decPrice,
      worker_cap_cost: listing.buy_price / decPrice,
      total_usd: listing.buy_price,
    };
  } else if (listing.currency == "DEC") {
    return {
      total_dec: listing.buy_price,
      worker_cap_cost: listing.buy_price,
      total_usd: listing.buy_price * decPrice,
    };
  } else {
    // Unknown currency, skip this listing.
    return null;
  }
}

/** Plan caps of the rental flow's config. */
export function rentalPlanCaps(config: RentalConfig): PlanCaps {
  return {
    batchSize: normalizeWorkerBatchSize(config.rental_batch_size),
    maxTotalDec: config.max_total_dec,
    maxPerWorker: config.max_dec_per_day_per_worker,
    minLandBasePp: config.min_land_base_pp,
    minFoil: config.min_foil,
    requireTerrainBoost: config.terrain_boost_only,
  };
}

/** Plan caps of the buy flow's config. */
export function buyPlanCaps(config: BuyConfig): PlanCaps {
  return {
    batchSize: normalizeWorkerBatchSize(config.buy_batch_size),
    maxTotalDec: config.max_total_dec,
    maxPerWorker: config.max_dec_per_worker,
    minLandBasePp: config.min_land_base_pp,
    minFoil: config.min_foil,
    requireTerrainBoost: config.terrain_boost_only,
  };
}

/** A rental plan from the shared planner run, with the rental-only fields. */
export async function buildRentalPlanWith(
  eligible: WorkerEligiblePlot[],
  config: RentalConfig,
  strategy: WorkerPlanStrategy<SeasonDaysResult>
): Promise<RentalPlan> {
  const base = await buildWorkerPlan(
    eligible,
    rentalPlanCaps(config),
    strategy
  );
  return {
    config,
    items: base.items,
    totals: base.totals,
    warnings: base.warnings,
    rental_days: base.ctx?.rental_days ?? null,
    rental_days_source: base.ctx?.source ?? "",
  };
}

/** A buy plan from the shared planner run. */
export async function buildBuyPlanWith(
  eligible: WorkerEligiblePlot[],
  config: BuyConfig,
  strategy: WorkerPlanStrategy<number>
): Promise<BuyPlan> {
  const base = await buildWorkerPlan(eligible, buyPlanCaps(config), strategy);
  return {
    config,
    items: base.items,
    totals: base.totals,
    warnings: base.warnings,
  };
}

/** A plan plus where each plot's picks will be staked. */
export interface WorkerExecutionPlan<P extends RentalPlan | BuyPlan> {
  plan: P;
  // deed_uid -> ordered list of empty slot numbers (1-based).
  emptySlotsByDeed: Record<string, number[]>;
  // Current worker cards for plots with picks, enriched for planner projections.
  plotWorkersByDeed: Record<string, WorkerPlanPlotCard[]>;
}

export type RentalExecutionPlan = WorkerExecutionPlan<RentalPlan>;
export type BuyExecutionPlan = WorkerExecutionPlan<BuyPlan>;
