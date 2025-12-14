"use server";

import logger from "@/lib/backend/log/logger.server";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import { determineCardMaxBCX, findCardRarity } from "@/lib/utils/cardUtil";
import {
  CardAlerts,
  CountAlert,
  DeedInfo,
  NegativeDecAlert,
  TerrainBoostAlerts,
  TerrainCardInfo,
} from "@/types/cardAlerts";
import { DeedComplete } from "@/types/deed";
import {
  CardElement,
  cardElementColorMap,
  TERRAIN_BONUS,
} from "@/types/planner";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";
import { getPlayerData } from "../../api/internal/player-data";
import { fetchPlayerBalances } from "../../api/spl/spl-base-api";
import { getResourceDECPrices } from "../../helpers/resourcePrices";
import { getCachedCardDetailsData } from "../../services/cardService";
import { getCachedPlayerCardCollection } from "../../services/playerService";
import { enrichWithProductionInfo } from "../../services/regionService";

/**
 * Helper to create DeedInfo from a deed
 * Eliminates repeated code for mapping deed to DeedInfo
 */
function createDeedInfo(deed: DeedComplete): DeedInfo {
  return {
    plotId: deed.plot_id!,
    regionNumber: deed.region_number!,
    plotNumber: deed.plot_number ?? 0,
    deedType: deed.deed_type ?? "Unknown",
    magicType: deed.magic_type ?? "Unknown",
    plotStatus: deed.plot_status ?? "Unknown",
    rarity: deed.rarity ?? "Unknown",
    worksiteType: deed.worksite_type ?? "Unknown",
    regionName: deed.region_name ?? "Unknown",
    tractNumber: deed.tract_number ?? 0,
    territory: deed.territory ?? "Unknown",
  };
}

/**
 * Server action to fetch player card alerts
 * Analyzes player's cards and deeds to identify potential issues
 */
export async function getPlayerCardAlerts(
  player: string,
  force: boolean = false
): Promise<CardAlerts> {
  if (!player || typeof player !== "string") {
    throw new Error("Player name is required");
  }

  const trimmed = player.trim().toLowerCase();

  try {
    logger.info(`Fetching card alerts for player: ${trimmed}`);

    // Fetch all data in parallel to improve execution time
    const [
      playerCardCollection,
      playerBalances,
      playerData,
      prices,
      cardDetails,
    ] = await Promise.all([
      getCachedPlayerCardCollection(player, force),
      fetchPlayerBalances(player),
      getPlayerData(player, {}, force),
      getResourceDECPrices(),
      getCachedCardDetailsData(),
    ]);

    const enrichedPlayerData = await enrichWithProductionInfo(
      playerData,
      prices
    );

    // Create indexes once to avoid repeated lookups
    const deedByPlotId = createDeedIndex(enrichedPlayerData);
    const cardDetailsById = createCardDetailsIndex(cardDetails);
    const cardsWithValidPlots = filterActiveCards(playerCardCollection);

    const ownedPowerCores =
      Number(
        playerBalances.find((b) => b.token === "POWER_CORE_PURCHASES")?.balance
      ) ?? 0;

    // Analyze all alerts in a single pass through deeds
    const { countAlerts, negativeAlerts, powerSourceAlerts } = analyzeAllDeeds(
      enrichedPlayerData,
      cardsWithValidPlots,
      deedByPlotId,
      ownedPowerCores
    );

    // Analyze cards for terrain bonuses
    const terrainBoostAlerts = analyzeTerrainBonuses(
      playerCardCollection,
      deedByPlotId,
      cardDetailsById
    );

    return {
      assignedWorkersAlerts: countAlerts,
      noWorkersAlerts: negativeAlerts.noWorkers,
      terrainBoostAlerts: terrainBoostAlerts,
      negativeDECNaturalResourceDeeds: negativeAlerts.negativeNaturalResource,
      negativeDECOtherResourceDeeds: negativeAlerts.negativeOtherResource,
      unusedPowerSource: powerSourceAlerts.unusedPowerSource,
      noPowerSource: powerSourceAlerts.noPowerSource,
      powerCoreWhileEnergized: powerSourceAlerts.powerCoreWhileEnergized,
    };
  } catch (error) {
    logger.error(`Failed to get card alerts for ${trimmed}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch alerts"
    );
  }
}

/**
 * Create a Map for O(1) deed lookups instead of repeated array searches
 */
function createDeedIndex(deeds: DeedComplete[]): Map<number, DeedComplete> {
  const index = new Map<number, DeedComplete>();
  for (const deed of deeds) {
    index.set(deed.plot_id!, deed);
  }
  return index;
}

/**
 * Create a Map for O(1) card details lookups instead of repeated array searches
 */
function createCardDetailsIndex(
  cardDetails: SplCardDetails[]
): Map<number, SplCardDetails> {
  const index = new Map<number, SplCardDetails>();
  for (const card of cardDetails) {
    index.set(card.id, card);
  }
  return index;
}

/**
 * Filter cards to only those with valid plots and no end dates
 * Reuse this filter across multiple analyses
 */
function filterActiveCards(
  cards: SplPlayerCardCollection[]
): SplPlayerCardCollection[] {
  return cards.filter((c) => c.stake_plot != null && c.stake_end_date == null);
}

/**
 * Single-pass analysis of all deeds to extract multiple alert types
 * Much more efficient than looping over deeds multiple times
 */
function analyzeAllDeeds(
  deeds: DeedComplete[],
  activeCards: SplPlayerCardCollection[],
  deedByPlot: Map<number, DeedComplete>,
  ownedPowerCores: number
): {
  countAlerts: CountAlert[];
  negativeAlerts: {
    noWorkers: DeedInfo[];
    negativeNaturalResource: NegativeDecAlert[];
    negativeOtherResource: NegativeDecAlert[];
  };
  powerSourceAlerts: {
    unusedPowerSource: number;
    noPowerSource: DeedInfo[];
    powerCoreWhileEnergized: DeedInfo[];
  };
} {
  // Build set of plots with cards once
  const plotsWithCards = new Set<number>();
  for (const card of activeCards) {
    plotsWithCards.add(card.stake_plot!);
  }

  // Accumulate card counts per plot
  const cardCountByPlot = new Map<
    number,
    { count: number; regionNumber: number }
  >();
  for (const card of activeCards) {
    const existing = cardCountByPlot.get(card.stake_plot!);
    if (existing) {
      existing.count++;
    } else {
      cardCountByPlot.set(card.stake_plot!, {
        count: 1,
        regionNumber: card.stake_region,
      });
    }
  }

  const noWorkers: DeedInfo[] = [];
  const negativeNaturalResource: NegativeDecAlert[] = [];
  const negativeOtherResource: NegativeDecAlert[] = [];
  const noPowerSource: DeedInfo[] = [];
  const powerCoreWhileEnergized: DeedInfo[] = [];
  let numberOfPowerCores = ownedPowerCores;

  // Single loop through all deeds
  for (const deed of deeds) {
    const deedInfo = createDeedInfo(deed);
    const plotId = deed.plot_id!;

    // Check for no workers
    if (!plotsWithCards.has(plotId)) {
      noWorkers.push(deedInfo);
    }

    // Check for negative DEC earnings
    const hasNetDec = deed.productionInfo?.netDEC != null;
    if (hasNetDec && (deed.productionInfo!.netDEC ?? 0) < -0.001) {
      const tokenSymbol = deed.worksiteDetail?.token_symbol;
      const alert: NegativeDecAlert = {
        negativeDecPerHour: deed.productionInfo!.netDEC!,
        deedInfo,
      };

      if (tokenSymbol && NATURAL_RESOURCES.includes(tokenSymbol)) {
        negativeNaturalResource.push(alert);
        // Ignore Castle and Keeps
      } else if (tokenSymbol && tokenSymbol !== "TAX") {
        negativeOtherResource.push(alert);
      }
    }

    // Check power source issues
    const isEnergized = deed.stakingDetail?.is_energized ?? false;
    const isPowered = deed.stakingDetail?.is_powered ?? false;
    const isPowerCoreStaked = deed.stakingDetail?.is_power_core_staked ?? false;

    if (isPowerCoreStaked && isEnergized) {
      powerCoreWhileEnergized.push(deedInfo);
    }
    if (!isPowered) {
      noPowerSource.push(deedInfo);
    }
    if (isPowerCoreStaked) {
      numberOfPowerCores--;
    }
  }

  // Build count alerts from accumulated data
  const countAlerts = Array.from(cardCountByPlot.entries())
    .filter(([_, data]) => data.count < 5)
    .map(([plotId, data]) => {
      const deed = deedByPlot.get(plotId);
      return {
        assignedCards: data.count,
        deedInfo: deed
          ? createDeedInfo(deed)
          : getDeedInfoForPlot(plotId, data.regionNumber),
      };
    });

  return {
    countAlerts,
    negativeAlerts: {
      noWorkers,
      negativeNaturalResource,
      negativeOtherResource,
    },
    powerSourceAlerts: {
      unusedPowerSource: numberOfPowerCores,
      noPowerSource,
      powerCoreWhileEnergized,
    },
  };
}

/**
 * Fallback for creating DeedInfo when deed is not found
 */
function getDeedInfoForPlot(plotId: number, regionNumber: number): DeedInfo {
  return {
    plotId,
    regionNumber,
    plotNumber: 0,
    deedType: "Unknown",
    magicType: "Unknown",
    plotStatus: "Unknown",
    rarity: "Unknown",
    worksiteType: "Unknown",
    regionName: "Unknown",
    tractNumber: 0,
    territory: "Unknown",
  };
}

/**
 * Analyze cards for terrain bonus issues
 */
function analyzeTerrainBonuses(
  cards: SplPlayerCardCollection[],
  deedByPlot: Map<number, DeedComplete>,
  cardDetailsById: Map<number, SplCardDetails>
): TerrainBoostAlerts {
  const negative: TerrainCardInfo[] = [];
  const zeroNeutral: TerrainCardInfo[] = [];
  const zeroNonNeutral: TerrainCardInfo[] = [];

  for (const card of cards) {
    if (card.stake_plot == null || card.stake_end_date != null) continue;

    const deed = deedByPlot.get(card.stake_plot);
    if (!deed) continue;

    const cardDetail = cardDetailsById.get(card.card_detail_id);
    if (!cardDetail) {
      logger.warning(
        `Card details not found for card_detail_id: ${card.card_detail_id}`
      );
      continue;
    }

    const rarity = findCardRarity([cardDetail], card.card_detail_id);
    const maxBcx = determineCardMaxBCX(card.card_set, rarity, card.foil);

    const elementColor = cardDetail.color.toLowerCase();
    const deedType = deed.deed_type!.toLowerCase();
    const element: CardElement =
      cardElementColorMap[elementColor] ?? ("neutral" as CardElement);
    const boost = TERRAIN_BONUS[deedType]?.[element] ?? 0;

    const item: TerrainCardInfo = {
      uid: card.uid,
      terrainBoost: boost,
      element,
      cardDetailId: card.card_detail_id,
      cardName: cardDetail.name,
      edition: card.edition,
      foil: card.foil,
      rarity,
      bcx: card.bcx,
      maxBcx,
      basePP: card.land_base_pp,
      deedInfo: createDeedInfo(deed),
    };

    if (boost < 0) negative.push(item);
    else if (boost === 0 && element === "neutral") zeroNeutral.push(item);
    else if (boost === 0 && element !== "neutral") zeroNonNeutral.push(item);
  }

  return { negative, zeroNeutral, zeroNonNeutral };
}
