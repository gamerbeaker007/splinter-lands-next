import { fetchMarketListingsByCard } from "@/lib/backend/api/spl/spl-base-api";
import logger from "@/lib/backend/log/logger.server";
import { loadRentalPlanCandidates } from "@/lib/backend/services/landWorkerPlanService";
import {
  buildRentalPlanWith,
  priceRentalListing,
} from "@/lib/shared/workerPlan";
import {
  RentalConfig,
  RentalPlan,
  WorkerEligiblePlot,
} from "@/types/landManager";

/**
 * Server-side rental plan (the dev worker-plan page). The land manager builds
 * the same plan in the browser (`buildRentalExecutionPlan`), reading listings
 * from the visitor's IP; both share lib/shared/workerPlan.ts.
 */
export function buildRentalPlan(
  eligible: WorkerEligiblePlot[],
  config: RentalConfig
): Promise<RentalPlan> {
  return buildRentalPlanWith(eligible, config, {
    label: "rental",
    loadCandidates: loadRentalPlanCandidates,
    fetchListings: (cardDetailId, foil, edition) =>
      fetchMarketListingsByCard({
        cardDetailId,
        foil,
        edition,
        type: "rent",
        rentalType: "season",
      }),
    priceListing: priceRentalListing,
    log: (message) => logger.info(message),
  });
}
