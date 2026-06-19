import {
  fetchMarketForRentGrouped,
  fetchMarketListingsByCard,
  fetchSettings,
} from "@/lib/backend/api/spl/spl-base-api";
import logger from "@/lib/backend/log/logger.server";
import {
  buildWorkerPlan,
  ListingPricing,
  PlanCaps,
  WorkerPlanStrategy,
} from "@/lib/backend/services/landWorkerPlanService";
import {
  RentalConfig,
  RentalPlan,
  WorkerEligiblePlot,
} from "@/types/landManager";
import { SplMarketListing } from "@/types/spl/marketListing";

const MS_PER_DAY = 86_400_000;

// ──────────────────────────────────────────────────────────────────────────
// Season / rental-days helpers (rental-specific run-once context)
// ──────────────────────────────────────────────────────────────────────────

interface SeasonDaysResult {
  /** null → fall back to per-listing expiration_date. */
  rental_days: number | null;
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

// ── Strategy: season rentals (cost = DEC/day × rental_days) ───────────────────

const rentalStrategy: WorkerPlanStrategy<SeasonDaysResult> = {
  label: "rental",
  fetchGrouped: fetchMarketForRentGrouped,
  fetchListings: (cardDetailId, foil, edition) =>
    fetchMarketListingsByCard({
      cardDetailId,
      foil,
      edition,
      type: "rent",
      rentalType: "season",
    }),
  async prepare(warnings) {
    const season = await computeRentalDaysForSeason();
    logger.info(
      `[rental] rental_days: ${season.rental_days ?? "per-listing"} - ${season.source}`
    );
    if (season.rental_days === null) {
      warnings.push(
        `Could not determine season end from /settings - using each listing's expiration_date instead (${season.source}).`
      );
    }
    return season;
  },
  priceListing(listing, season): ListingPricing | null {
    const rentalDays = rentalDaysFromListing(listing, season.rental_days);
    if (rentalDays <= 0) return null;
    return {
      total_dec: listing.buy_price * rentalDays,
      buy_price_per_day: listing.buy_price,
      rental_days: rentalDays,
      expiration_date: listing.expiration_date,
    };
  },
};

export async function buildRentalPlan(
  eligible: WorkerEligiblePlot[],
  config: RentalConfig
): Promise<RentalPlan> {
  const caps: PlanCaps = {
    batchSize: config.rental_batch_size,
    maxTotalDec: config.max_total_dec,
    maxPerWorker: config.max_dec_per_day_per_worker,
    minLandBasePp: config.min_land_base_pp,
    minFoil: config.min_foil,
  };
  const base = await buildWorkerPlan(eligible, caps, rentalStrategy);
  return {
    config,
    items: base.items,
    totals: base.totals,
    warnings: base.warnings,
    rental_days: base.ctx?.rental_days ?? null,
    rental_days_source: base.ctx?.source ?? "",
  };
}
