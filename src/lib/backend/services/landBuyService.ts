import { fetchMarketListingsByCard } from "@/lib/backend/api/spl/spl-base-api";
import logger from "@/lib/backend/log/logger.server";
import { loadBuyPlanCandidates } from "@/lib/backend/services/landWorkerPlanService";
import { buildBuyPlanWith, priceBuyListing } from "@/lib/shared/workerPlan";
import { BuyConfig, BuyPlan, WorkerEligiblePlot } from "@/types/landManager";

/**
 * Server-side buy plan (the dev worker-plan page). The land manager builds the
 * same plan in the browser (`buildBuyExecutionPlan`); both share
 * lib/shared/workerPlan.ts.
 */
export function buildBuyPlan(
  eligible: WorkerEligiblePlot[],
  config: BuyConfig
): Promise<BuyPlan> {
  return buildBuyPlanWith(eligible, config, {
    label: "buy",
    loadCandidates: loadBuyPlanCandidates,
    fetchListings: (cardDetailId, foil, edition) =>
      fetchMarketListingsByCard({
        cardDetailId,
        foil,
        edition,
        type: "sell",
        // By-card level: 99 = max (mirrors the grouped max-level selection).
        level: 99,
      }),
    priceListing: priceBuyListing,
    log: (message) => logger.info(message),
  });
}
