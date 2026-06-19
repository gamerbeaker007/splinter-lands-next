import {
  fetchMarketForSaleGrouped,
  fetchMarketListingsByCard,
} from "@/lib/backend/api/spl/spl-base-api";
import {
  buildWorkerPlan,
  ListingPricing,
  PlanCaps,
  WorkerPlanStrategy,
} from "@/lib/backend/services/landWorkerPlanService";
import { BuyConfig, BuyPlan, WorkerEligiblePlot } from "@/types/landManager";
import { getPrices } from "../api/spl/spl-prices-api";

// ── Strategy: outright purchases (cost = one-time DEC price, no per-day) ──────

const buyStrategy: WorkerPlanStrategy<number> = {
  label: "buy",
  fetchGrouped: fetchMarketForSaleGrouped,
  fetchListings: (cardDetailId, foil, edition) =>
    fetchMarketListingsByCard({
      cardDetailId,
      foil,
      edition,
      type: "sell",
      // By-card level: 99 = max (mirrors the grouped max-level selection).
      level: 99,
    }),
  async prepare() {
    return (await getPrices()).dec ?? 0;
  },
  priceListing(listing, decPrice): ListingPricing | null {
    if (listing.currency == "USD") {
      return { total_dec: listing.buy_price / decPrice };
    } else if (listing.currency == "DEC") {
      return { total_dec: listing.buy_price };
    } else {
      // Unknown currency, skip this listing.
      return null;
    }
  },
};

export async function buildBuyPlan(
  eligible: WorkerEligiblePlot[],
  config: BuyConfig
): Promise<BuyPlan> {
  const caps: PlanCaps = {
    batchSize: config.buy_batch_size,
    maxTotalDec: config.max_total_dec,
    maxPerWorker: config.max_dec_per_worker,
    minLandBasePp: config.min_land_base_pp,
    minFoil: config.min_foil,
  };
  const base = await buildWorkerPlan(eligible, caps, buyStrategy);
  return {
    config,
    items: base.items,
    totals: base.totals,
    warnings: base.warnings,
  };
}
