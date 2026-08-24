import { Resource } from "@/constants/resource/resource";
import { Prices } from "@/types/price";
import { ProductionInfo, ResourceWithDEC } from "@/types/productionInfo";
import { RegionTax } from "@/types/regionTax";
import { calcDECPrice } from "./costCalc";
import { TAX_RATE } from "./statics";

/**
 * Per-hour tax income of a CASTLE / KEEP worksite.
 *
 * Castles and keeps do not produce a resource; they capture a share of the tax
 * on everything produced in their region (castle) or tract (keep):
 *
 *   captured/hour = production/hour in the region|tract × TAX_RATE × captureRate
 *
 * This is an *estimate*: it assumes every plot in that region/tract keeps
 * producing at its current rate, while tax is only actually captured when those
 * plots are harvested by their owners. See {@link TAX_ESTIMATE_NOTE}.
 *
 * Shared by the planner and the Land Manager Production page so both report the
 * same number.
 */

/** Grain consumed for castle/keep harvest action. */
export const TAX_WORKSITE_GRAIN_FLAT_FEE: Record<string, number> = {
  CASTLE: 10_000,
  KEEP: 1_000,
};

/** Why the per-hour tax income can deviate from what is actually collected. */
export const TAX_ESTIMATE_NOTE =
  "Estimated tax income per hour, derived from the current production of the " +
  "plots in this region/tract. Tax is only captured when those plots are " +
  "harvested by their owners, so the actual amount can deviate.";

/** The resource rewards/hour a castle (region-wide) or keep (its tract) taxes. */
function taxableRewardsPerHour(
  worksiteType: string,
  regionTax: RegionTax | undefined,
  tractNumber: number | null | undefined
): Record<string, number> {
  if (!regionTax) return {};
  return worksiteType === "KEEP"
    ? (regionTax.perTract?.[String(tractNumber ?? "")]
        ?.resourceRewardsPerHour ?? {})
    : (regionTax.resourceRewardsPerHour ?? {});
}

/** Captured tax per hour, per resource, valued in DEC. */
export function calcCapturedTaxProduce(
  worksiteType: string,
  regionTax: RegionTax | undefined,
  tractNumber: number | null | undefined,
  captureRate: number,
  prices: Prices
): ResourceWithDEC[] {
  const rewardsPerHour = taxableRewardsPerHour(
    worksiteType,
    regionTax,
    tractNumber
  );

  return Object.entries(rewardsPerHour).map(([resource, perHour]) => {
    const amount = perHour * TAX_RATE * captureRate;
    return {
      resource: resource as Resource,
      amount,
      sellPriceDEC: calcDECPrice("sell", resource, amount, prices),
      buyPriceDEC: calcDECPrice("buy", resource, amount, prices),
    };
  });
}

/**
 * Production info for a castle/keep: captured tax per hour as produce, and the
 * grain consumption as a flat fee — it is a fixed upkeep, not a resource cost,
 * so it is priced at 0 DEC and does not reduce the net.
 */
export function calcTaxProductionInfo(
  worksiteType: string,
  regionTax: RegionTax | undefined,
  tractNumber: number | null | undefined,
  captureRate: number,
  prices: Prices
): ProductionInfo {
  const produce = calcCapturedTaxProduce(
    worksiteType,
    regionTax,
    tractNumber,
    captureRate,
    prices
  );

  return {
    resource: "TAX" as Resource,
    consume: [
      {
        resource: "GRAIN" as Resource,
        amount: TAX_WORKSITE_GRAIN_FLAT_FEE[worksiteType] ?? 0,
        // Flat fee: excluded from the DEC net on purpose.
        sellPriceDEC: 0,
        buyPriceDEC: 0,
      },
    ],
    produce,
    netDEC: produce.reduce((sum, row) => sum + row.sellPriceDEC, 0),
  };
}
