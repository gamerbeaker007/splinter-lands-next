import { getCachedPlayerCardCollection } from "@/lib/backend/services/playerService";
import { NextResponse } from "next/server";
import { getPlayerData } from "@/lib/backend/api/internal/player-data";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import { DeedComplete } from "@/types/deed";
import { SplCardDetails } from "@/types/splCardDetails";
import {
  CardElement,
  cardElementColorMap,
  TERRAIN_BONUS,
} from "@/types/planner";
import logger from "@/lib/backend/log/logger.server";
import {
  CardAlerts,
  CountAlert,
  DeedInfo,
  TerrainBoostAlerts,
  TerrainCardInfo,
} from "@/types/CardAlerts";

export async function POST(req: Request) {
  try {
    const { player, force } = await req.json();
    if (!player) {
      return NextResponse.json(
        { error: "Missing 'player' parameter" },
        { status: 400 },
      );
    }

    const playerCardCollection = await getCachedPlayerCardCollection(
      player,
      force,
    );
    const playerData = await getPlayerData(player, {}, force);
    const cardDetails = await getCachedCardDetailsData();

    const indexedDeedsByPlotId = indexDeedsByPlotId(playerData);

    const countAlerts = plotsWithLessThanCards(
      playerCardCollection,
      indexedDeedsByPlotId,
    );
    const noWorkers = plotsWithNoWorkers(playerData, playerCardCollection);
    const terrainBoostAlerts = classifyCardsByTerrainBonus(
      playerCardCollection,
      indexedDeedsByPlotId,
      cardDetails,
    );

    const retVal: CardAlerts = {
      assignedWorkersAlerts: countAlerts,
      noWorkersAlerts: noWorkers,
      terrainBoostAlerts: terrainBoostAlerts,
    };

    return NextResponse.json(retVal, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    const isNotFound = message.toLowerCase().includes("not found");
    return NextResponse.json(
      { error: message },
      { status: isNotFound ? 404 : 501 },
    );
  }
}

function indexDeedsByPlotId(deeds: DeedComplete[]) {
  const deedByPlot = new Map<number, DeedComplete>();
  for (const d of deeds) {
    deedByPlot.set(d.plot_id!, d);
  }
  return deedByPlot;
}

function plotsWithLessThanCards(
  cards: SplPlayerCardCollection[],
  indexDeeds: Map<number, DeedComplete>,
  minCount = 5,
): CountAlert[] {
  // Group by stake_plot (ignore null plot)
  const byPlot = new Map<number, CountAlert>();

  for (const c of cards) {
    if (c.stake_plot == null || c.stake_end_date != null) continue;
    const deed = indexDeeds.get(c.stake_plot);

    const current = byPlot.get(c.stake_plot);
    if (current) {
      current.assignedCards += 1;
      // region should be consistent; keep the first non-null we see
      if (current.deedInfo == null && c.stake_region != null) {
        current.deedInfo = {
          plotId: c.stake_plot,
          regionNumber: c.stake_region,
          plotNumber: deed?.plot_number ?? 0,
          deedType: deed?.deed_type ?? "Unknown",
          magicType: deed?.magic_type ?? "Unknown",
          plotStatus: deed?.plot_status ?? "Unknown",
          rarity: deed?.rarity ?? "Unknown",
          worksiteType: deed?.worksite_type ?? "Unknown",
          regionName: deed?.region_name ?? "Unknown",
          tractNumber: deed?.tract_number ?? 0,
          territory: deed?.territory ?? "Unknown",
        };
      }
    } else {
      byPlot.set(c.stake_plot, {
        assignedCards: 1,
        deedInfo: {
          regionNumber: c.stake_region,
          plotId: c.stake_plot,
          plotNumber: deed?.plot_number ?? 0,
          deedType: deed?.deed_type ?? "Unknown",
          magicType: deed?.magic_type ?? "Unknown",
          plotStatus: deed?.plot_status ?? "Unknown",
          rarity: deed?.rarity ?? "Unknown",
          worksiteType: deed?.worksite_type ?? "Unknown",
          regionName: deed?.region_name ?? "Unknown",
          tractNumber: deed?.tract_number ?? 0,
          territory: deed?.territory ?? "Unknown",
        },
      });
    }
  }

  // Filter < minCount
  return Array.from(byPlot.values()).filter((v) => v.assignedCards < minCount);
}

function plotsWithNoWorkers(
  deeds: DeedComplete[],
  cards: SplPlayerCardCollection[],
): DeedInfo[] {
  // Set of plots that have at least one card
  const plotsWithCards = new Set<number>();
  for (const c of cards) {
    if (c.stake_plot != null && c.stake_end_date == null)
      plotsWithCards.add(c.stake_plot);
  }

  // Any deed whose plot_id is NOT in plotsWithCards → no workers
  return deeds
    .filter((d) => !plotsWithCards.has(d.plot_id!))
    .map((d) => ({
      plotId: d.plot_id!,
      regionNumber: d.region_number!,
      plotNumber: d.plot_number!,
      deedType: d.deed_type!,
      magicType: d.magic_type!,
      plotStatus: d.plot_status!,
      rarity: d.rarity!,
      worksiteType: d.worksite_type!,
      regionName: d.region_name!,
      tractNumber: d.tract_number!,
      territory: d.territory!,
    }));
}

function classifyCardsByTerrainBonus(
  cards: SplPlayerCardCollection[],
  deedByPlot: Map<number, DeedComplete>,
  cardDetails: SplCardDetails[],
): TerrainBoostAlerts {
  const negative: Array<TerrainCardInfo> = [];
  const zeroNeutral: Array<TerrainCardInfo> = [];
  const zeroNonNeutral: Array<TerrainCardInfo> = [];

  for (const c of cards) {
    if (c.stake_plot == null || c.stake_end_date != null) continue;

    const deed = deedByPlot.get(c.stake_plot);
    if (!deed) continue; // plot might not be in player's deeds array

    const cd = cardDetails.find((cd) => cd.id === c.card_detail_id);
    if (!cd) {
      logger.warning(
        `Card details not found for card_detail_id: ${c.card_detail_id}`,
      );
      continue;
    } // skip if we lack details

    const elementColor = cd.color.toLowerCase();
    const deedType = deed.deed_type!.toLowerCase();
    const element: CardElement =
      cardElementColorMap[elementColor] ?? ("neutral" as CardElement);

    const boost = TERRAIN_BONUS[deedType]?.[element] ?? 0;

    const item: TerrainCardInfo = {
      terrainBoost: boost,
      element: element,
      cardDetailId: c.card_detail_id,
      cardName: cd.name,
      edition: c.edition,
      foil: c.foil,
      deedInfo: {
        plotId: c.stake_plot,
        regionNumber: c.stake_region,
        deedType: deedType,
        plotNumber: deed?.plot_number ?? 0,
        magicType: deed?.magic_type ?? "Unknown",
        plotStatus: deed?.plot_status ?? "Unknown",
        rarity: deed?.rarity ?? "Unknown",
        worksiteType: deed?.worksite_type ?? "Unknown",
        regionName: deed?.region_name ?? "Unknown",
        tractNumber: deed?.tract_number ?? 0,
        territory: deed?.territory ?? "Unknown",
      },
    };

    if (boost < 0) negative.push(item);
    else if (boost === 0 && element === "neutral") zeroNeutral.push(item);
    else if (boost === 0 && element !== "neutral") zeroNonNeutral.push(item);
  }

  return { negative, zeroNeutral, zeroNonNeutral };
}
