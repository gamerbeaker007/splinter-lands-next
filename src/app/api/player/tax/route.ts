import { getCachedRegionData } from "@/lib/backend/api/internal/deed-data";
import { logError } from "@/lib/backend/log/logUtils";
import { getCachedResourcePrices } from "@/lib/backend/services/resourceService";
import { filterDeeds } from "@/lib/filters";
import { NextResponse } from "next/server";

const TAX_RATE = 0.1;

export async function POST(req: Request) {
  try {
    const { player } = await req.json();
    const allData = await getCachedRegionData();
    const resourcePrices = await getCachedResourcePrices();
    const playerData = filterDeeds(allData, {
      filter_players: [player],
      filter_worksites: ["KEEP", "CASTLE"],
    });

    const results = [];
    if (playerData.length > 0) {
      for (const deed of playerData) {
        const capture_rate = deed.worksiteDetail?.captured_tax_rate ?? 0;
        const worksiteType = deed.worksiteDetail?.worksite_type;
        const regionUid = deed.region_uid!;
        let groupData = [];

        if (worksiteType === "KEEP") {
          const tractNumber = deed.tract_number ?? 0;
          const regionNumber = deed.region_number ?? 0;
          groupData = filterDeeds(allData, {
            filter_regions: [regionNumber],
            filter_tracts: [tractNumber],
          });
        } else if (worksiteType === "CASTLE") {
          const regionNumber = deed.region_number ?? 0;
          groupData = filterDeeds(allData, { filter_regions: [regionNumber] });
        } else {
          continue;
        }

        const resourceMap: Record<string, number> = {};

        for (const d of groupData) {
          const ws = d.worksiteDetail;
          if (
            ws &&
            ws.token_symbol &&
            typeof ws.rewards_per_hour === "number"
          ) {
            resourceMap[ws.token_symbol] =
              (resourceMap[ws.token_symbol] ?? 0) + ws.rewards_per_hour;
          }
        }

        const resources = Object.entries(resourceMap).map(
          ([token, total_rewards_per_hour]) => {
            const total_tax = total_rewards_per_hour * TAX_RATE;
            const captured = total_tax * capture_rate;
            const dec = resourcePrices[token.toLowerCase()] * captured;
            return { token, total_rewards_per_hour, total_tax, captured, dec };
          },
        );

        results.push({
          region_uid: regionUid,
          tract_number: deed.tract_number,
          type: worksiteType,
          capture_rate,
          resources,
        });
      }
    }

    return NextResponse.json(results.length > 0 ? results : null);
  } catch (err) {
    logError("Failed to load player tax data", err);
    return NextResponse.json(
      { error: "Failed to load player tax data" },
      { status: 501 },
    );
  }
}
