import { getPlayerData } from "@/lib/backend/api/internal/player-data";
import { logError } from "@/lib/backend/log/logUtils";
import { DeedComplete } from "@/types/deed";
import { NextResponse } from "next/server";
import { calcCosts } from "@/lib/shared/costCalc";
import { prepareSummary } from "@/lib/backend/helpers/productionCosts";
import {
  computeNetValues,
  computeResourceNetValue,
} from "@/lib/backend/helpers/computeNetValues";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";

export async function POST(req: Request) {
  try {
    const { filters, player, force } = await req.json();

    const playerData: DeedComplete[] = await getPlayerData(
      player,
      filters,
      force,
    );

    const totalResourceCounts: Record<string, number> = {};
    const playerDataInclCosts = playerData.map((deed: DeedComplete) => {
      const regionUid = deed.region_uid ?? "";
      const rewardsPerHour = deed.worksiteDetail?.rewards_per_hour ?? 0;
      const tokenSymbol = deed.worksiteDetail?.token_symbol ?? "";
      const basePP = deed.stakingDetail?.total_base_pp_after_cap ?? 0;
      const boostedPP = deed.stakingDetail?.total_harvest_pp ?? 0;
      const countColumn = `${tokenSymbol.toLowerCase()}_count`;
      totalResourceCounts[countColumn] =
        (totalResourceCounts[countColumn] ?? 0) + 1;

      const costs = calcCosts(tokenSymbol, basePP);

      return {
        region_uid: regionUid,
        token_symbol: tokenSymbol,
        rewards_per_hour: rewardsPerHour,
        total_harvest_pp: basePP,
        total_base_pp_after_cap: boostedPP,
        ...costs,
      };
    });

    const regionSummary = prepareSummary(playerDataInclCosts, true, true);

    // add totals (dec + resources
    // dec + per resource
    const resourcePrices = await getCachedResourcePrices();
    const { dec_net, total_dec } = computeNetValues(
      regionSummary,
      resourcePrices,
    );
    const resource_net = computeResourceNetValue(regionSummary);

    const returnVal = {
      regionSummary: regionSummary,
      totals: {
        ...resource_net,
        total_dec,
        ...dec_net,
        ...totalResourceCounts,
      },
    };

    if (!returnVal)
      return NextResponse.json({ error: "No data found" }, { status: 404 });

    return NextResponse.json(returnVal);
  } catch (err) {
    logError("Failed to load player data", err);
    return NextResponse.json(
      { error: "Failed to load player data" },
      { status: 501 },
    );
  }
}
