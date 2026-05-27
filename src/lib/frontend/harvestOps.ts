import { buildHarvestOp } from "@/lib/shared/operations/opBuilders";
import { SplHarvestableResource } from "@/types/spl/landManager";

interface HarvestRegion {
  region_uid: string;
  region_number: number;
  name: string;
}

/** Build the harvest_all op for a single region. */
export function buildRegionHarvestOnlyOp(
  username: string,
  region: HarvestRegion
): { ops: [string, object][]; log: string[] } {
  return {
    ops: [buildHarvestOp(username, region.region_uid)],
    log: [`[${region.name}] harvest`],
  };
}

/** Sum harvested amounts into a { symbol: total } map for log persistence. */
export function summarizeHarvestedResources(
  harvestable: Record<string, SplHarvestableResource[]>
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const items of Object.values(harvestable)) {
    for (const item of items) {
      totals[item.token_symbol] = Number.parseFloat(
        ((totals[item.token_symbol] ?? 0) + item.amount_claimable).toFixed(3)
      );
    }
  }
  return totals;
}
