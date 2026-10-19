import {
  fetchMarketForRentGrouped,
  fetchMarketForSaleGrouped,
  fetchSettings,
} from "@/lib/backend/api/spl/spl-base-api";
import { getCachedSplPriceData } from "@/lib/backend/services/tokenService";
import { cache } from "@/lib/backend/cache/cache";
import logger from "@/lib/backend/log/logger.server";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import {
  PlanCaps,
  PlotBiomeModifiers,
  rentalDaysForSeason,
  SeasonDaysResult,
  seasonDaysWarnings,
  selectCandidateTuples,
  WorkerPlanCandidates,
} from "@/lib/shared/workerPlan";
import { SplMarketListingGrouped } from "@/types/spl/marketListing";

/**
 * Server half of the worker planner (lib/shared/workerPlan.ts): candidate
 * selection runs here because it needs the shared grouped market snapshot and
 * the card details — both server-cached, neither worth shipping to every
 * browser. The live per-card listings are fetched by whoever runs the plan.
 */

/**
 * The grouped market is shared data (same for every visitor) — cache it
 * briefly. It only picks candidate tuples; their listings are read live.
 */
const GROUPED_MARKET_TTL_SECONDS = 60;

async function cachedGrouped(
  key: string,
  fetchGrouped: () => Promise<SplMarketListingGrouped[]>
): Promise<SplMarketListingGrouped[]> {
  const cached = cache.get<SplMarketListingGrouped[]>(key);
  if (cached) return cached;
  const grouped = await fetchGrouped();
  cache.set(key, grouped, GROUPED_MARKET_TTL_SECONDS);
  return grouped;
}

async function loadCandidates<Ctx>(
  label: string,
  biomeModifiers: PlotBiomeModifiers[],
  caps: PlanCaps,
  fetchGrouped: () => Promise<SplMarketListingGrouped[]>,
  prepare: (warnings: string[]) => Promise<Ctx>
): Promise<WorkerPlanCandidates<Ctx>> {
  const [cardDetails, grouped] = await Promise.all([
    getCachedCardDetailsData(),
    cachedGrouped(`market-grouped:${label}`, fetchGrouped),
  ]);
  logger.info(`[${label}] grouped market entries: ${grouped.length}`);

  const { tuples, cards } = selectCandidateTuples(
    grouped,
    cardDetails,
    biomeModifiers,
    caps,
    (message) => logger.info(`[${label}] ${message}`)
  );
  const warnings: string[] = [];
  const ctx = tuples.length > 0 ? await prepare(warnings) : null;
  return { tuples, cards, groupedCount: grouped.length, ctx, warnings };
}

/** Candidates for season rentals, with the season's rental days as context. */
export function loadRentalPlanCandidates(
  biomeModifiers: PlotBiomeModifiers[],
  caps: PlanCaps
): Promise<WorkerPlanCandidates<SeasonDaysResult>> {
  return loadCandidates(
    "rental",
    biomeModifiers,
    caps,
    fetchMarketForRentGrouped,
    async (warnings) => {
      const [settings, prices] = await Promise.all([
        fetchSettings(),
        getCachedSplPriceData(),
      ]);
      const season = rentalDaysForSeason(settings);
      logger.info(
        `[rental] rental_days: ${season.rental_days ?? "per-listing"} - ${season.source}`
      );
      warnings.push(...seasonDaysWarnings(season));
      return { ...season, usd_per_dec: prices.dec ?? 0 };
    }
  );
}

/** Candidates for outright purchases, with the DEC price (USD) as context. */
export function loadBuyPlanCandidates(
  biomeModifiers: PlotBiomeModifiers[],
  caps: PlanCaps
): Promise<WorkerPlanCandidates<number>> {
  return loadCandidates(
    "buy",
    biomeModifiers,
    caps,
    fetchMarketForSaleGrouped,
    async () => (await getCachedSplPriceData()).dec ?? 0
  );
}
