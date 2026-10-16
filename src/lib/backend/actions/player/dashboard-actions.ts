"use server";

import { getCachedRegionDataSSR } from "@/lib/backend/api/internal/deed-data";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { filterDeeds } from "@/lib/filters";
import type { PlayerOverviewGlobals } from "@/lib/shared/player/playerOverview";
import { processPlayerTaxIncome } from "@/lib/shared/player/playerRegion";

/**
 * The dashboard parts that need the region-wide DB data: the global base PP
 * (for the player's land share) and the player's Keep/Castle tax income. No
 * SPL call — the player's own deeds are read in the browser
 * (`loadPlayerOverview`, lib/frontend/player-data.ts).
 */
export async function getPlayerOverviewGlobals(
  player: string
): Promise<PlayerOverviewGlobals> {
  const allData = await getCachedRegionDataSSR();
  const resourcePrices = await getCachedResourcePrices();

  //DEC Tax Income
  const playerData = filterDeeds(allData, {
    filter_players: [player],
    filter_worksites: ["KEEP", "CASTLE"],
  });
  const regionTaxSummary =
    playerData.length > 0
      ? processPlayerTaxIncome(playerData, allData, resourcePrices)
      : null;
  const totalTaxDec = regionTaxSummary
    ? Object.entries(regionTaxSummary).reduce(
        (sum, [, region]) => sum + (Number(region.total_tax_dec) || 0),
        0
      )
    : null;

  let totalBasePP = 0;
  let totalBasePPIncludingEfficiency = 0;
  for (const deed of allData) {
    const basePP = deed?.stakingDetail?.total_base_pp_after_cap || 0;
    const siteEfficiency = deed?.worksiteDetail?.site_efficiency || 0;
    totalBasePP += basePP;
    totalBasePPIncludingEfficiency += basePP * siteEfficiency;
  }

  return { totalBasePP, totalBasePPIncludingEfficiency, totalTaxDec };
}

/**
 * The server's shared resource DEC prices (1 h cache), for computations the
 * browser runs on the player's own deeds.
 */
export async function getSharedResourcePrices() {
  return getCachedResourcePrices();
}
