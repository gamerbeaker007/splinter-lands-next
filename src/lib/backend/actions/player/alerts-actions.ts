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
    plotId: deed.plot_id,
    regionNumber: deed.region_number,
    plotNumber: deed.plot_number,
    deedType: deed.deed_type ?? "Unknown",
    magicType: deed.magic_type ?? "Unknown",
    plotStatus: deed.plot_status ?? "Unknown",
    rarity: deed.rarity ?? "Unknown",
    worksiteType: deed.worksiteDetail?.worksite_type ?? "Unknown",
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

    const ownedPowerCores =
      Number(
        playerBalances.find((b) => b.token === "POWER_CORE_PURCHASES")?.balance
      ) ?? 0;

    // Analyze all alerts in a single pass through deeds
    const { countAlerts, negativeAlerts, powerSourceAlerts } = analyzeAllDeeds(
      enrichedPlayerData,
      ownedPowerCores
    );

    // Analyze cards for terrain bonuses
    const terrainBoostAlerts = analyzeTerrainBonuses(
      playerCardCollection,
      enrichedPlayerData,
      cardDetails
    );

    const missingBloodLineBoost = analyzeMissingBloodLineBoost(
      player,
      playerCardCollection,
      enrichedPlayerData,
      cardDetails
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
      missingBloodLineBoost: missingBloodLineBoost,
    };
  } catch (error) {
    logger.error(`Failed to get card alerts for ${trimmed}:`, error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch alerts"
    );
  }
}

/**
 * Find missing bloodline based on player cards
 * When there is a card with bloodline boost staked to a deed
 * but there is no other bloodline on the same deed, it will raise an alert
 */
function analyzeMissingBloodLineBoost(
  player: string,
  cards: SplPlayerCardCollection[],
  deeds: DeedComplete[],
  splCardDetails: SplCardDetails[]
): DeedInfo[] {
  const now = new Date();
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
  const alertedDeedUids = new Set<string>();

  // Helper to extract bloodline from card
  const getBloodline = (cardDetailId: number, level: number): string | null => {
    const splCard = splCardDetails.find((cd) => cd.id === cardDetailId);
    const landAbilities = splCard?.stats?.land_abilities[level];
    const bloodlineAbility = landAbilities?.find(
      (ability) => ability[0] === "BLOODLINE"
    );
    return bloodlineAbility ? (bloodlineAbility[2] as string) : null;
  };

  // Group ALL cards by stake_ref_uid for efficient lookup
  const cardsByStakeRef = new Map<string, SplPlayerCardCollection[]>();
  for (const card of cards) {
    // Include all staked cards, regardless of card_set
    const isStaked =
      card.stake_ref_uid !== null &&
      (!card.stake_end_date ||
        new Date(card.stake_end_date).getTime() >
          now.getTime() + threeDaysInMs) &&
      (!card.delegated_to || card.delegated_to === player);

    if (!isStaked) continue;

    const stakeRef = card.stake_ref_uid!;
    if (!cardsByStakeRef.has(stakeRef)) {
      cardsByStakeRef.set(stakeRef, []);
    }
    cardsByStakeRef.get(stakeRef)!.push(card);
  }

  // Check each land card with bloodline ability
  for (const card of cards) {
    const isStakedOnLand =
      card.stake_ref_uid !== null &&
      (!card.stake_end_date ||
        new Date(card.stake_end_date).getTime() >
          now.getTime() + threeDaysInMs);
    const isLandSet = card.card_set === "land";
    const isStakedToPlayer = !card.delegated_to || card.delegated_to === player;

    if (!isStakedOnLand || !isLandSet || !isStakedToPlayer) continue;

    const bloodline = getBloodline(card.card_detail_id, card.level);
    if (!bloodline) continue;

    // Count cards with matching bloodline on the same deed
    const cardsOnSameDeed = cardsByStakeRef.get(card.stake_ref_uid!) || [];
    const bloodlineCount = cardsOnSameDeed.filter((otherCard) => {
      const otherSplCard = splCardDetails.find(
        (cd) => cd.id === otherCard.card_detail_id
      );
      return otherSplCard?.sub_type === bloodline;
    }).length;

    // Need at least 2 cards with the bloodline (the card itself + another)
    if (bloodlineCount < 2 && !alertedDeedUids.has(card.stake_ref_uid!)) {
      alertedDeedUids.add(card.stake_ref_uid!);
    }
  }

  // Convert deed UIDs to DeedInfo objects
  return Array.from(alertedDeedUids)
    .map((deedUid) => deeds.find((d) => d.deed_uid === deedUid))
    .filter((deed): deed is DeedComplete => deed !== undefined)
    .map(createDeedInfo);
}

/**
 * Single-pass analysis of all deeds to extract multiple alert types
 * Much more efficient than looping over deeds multiple times
 */
function analyzeAllDeeds(
  deeds: DeedComplete[],
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
  const countAlerts: CountAlert[] = [];
  const noWorkers: DeedInfo[] = [];
  const negativeNaturalResource: NegativeDecAlert[] = [];
  const negativeOtherResource: NegativeDecAlert[] = [];
  const noPowerSource: DeedInfo[] = [];
  const powerCoreWhileEnergized: DeedInfo[] = [];
  let numberOfPowerCores = ownedPowerCores;

  // Single loop through all deeds
  for (const deed of deeds) {
    const deedInfo = createDeedInfo(deed);
    const workersCount = deed.stakingDetail?.worker_count ?? 0;

    // Check for no workers
    if (workersCount === 0) {
      noWorkers.push(deedInfo);
    }

    // Check for workers below 5
    if (workersCount > 0 && workersCount < 5) {
      countAlerts.push({
        assignedCards: workersCount,
        deedInfo,
      });
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
 * Analyze cards for terrain bonus issues
 */
function analyzeTerrainBonuses(
  cards: SplPlayerCardCollection[],
  deeds: DeedComplete[],
  cardDetails: SplCardDetails[]
): TerrainBoostAlerts {
  const negative: TerrainCardInfo[] = [];
  const zeroNeutral: TerrainCardInfo[] = [];
  const zeroNonNeutral: TerrainCardInfo[] = [];

  for (const card of cards) {
    if (card.stake_plot == null || card.stake_end_date != null) continue;

    const deed = deeds.find((d) => d.plot_id === card.stake_plot);
    if (!deed) continue;

    const cardDetail = cardDetails.find((cd) => cd.id === card.card_detail_id);
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
    else if (boost === 0 && element === "neutral" && item.cardName != "Runi")
      zeroNeutral.push(item);
    else if (boost === 0 && element !== "neutral") zeroNonNeutral.push(item);
  }

  return { negative, zeroNeutral, zeroNonNeutral };
}
