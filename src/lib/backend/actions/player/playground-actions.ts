"use server";

import { Resource } from "@/constants/resource/resource";
import { mapRegionDataToDeedComplete } from "@/lib/backend/api/internal/player-data";
import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import {
  getCachedPlayerCardCollection,
  getCachedPlayerData,
} from "@/lib/backend/services/playerService";
import { determineBcxCap, determineCardInfo } from "@/lib/utils/cardUtil";
import {
  CardSetName,
  CardSetNameLandValid,
  editionMap,
} from "@/types/editions";
import {
  CardBloodline,
  CardElement,
  cardElementColorMap,
  cardFoilOptions,
  CardRarity,
  cardRarityOptions,
  DeedType,
  MagicType,
  PlotRarity,
  PlotStatus,
  RUNI_FLAT_ADD,
  RuniTier,
  SlotInput,
  titleModifiers,
  TitleTier,
  totemModifiers,
  TotemTier,
  WorksiteType,
} from "@/types/planner";
import {
  PlaygroundCard,
  PlaygroundData,
  PlaygroundDeed,
} from "@/types/playground";

/**
 * Fetch optimized player data for the playground
 * Only returns essential fields to reduce data transfer
 */
export async function getPlaygroundData(
  player: string
): Promise<PlaygroundData> {
  if (!player) {
    throw new Error("Player parameter is required");
  }

  // Fetch data in parallel
  const [regionData, cardCollection, cardDetails] = await Promise.all([
    getCachedPlayerData(player),
    getCachedPlayerCardCollection(player),
    getCachedCardDetailsData(),
  ]);

  // Convert and map deeds
  const deedComplete = mapRegionDataToDeedComplete(regionData);

  // Sort deeds by region, tract, plot
  const sortedDeeds = deedComplete.sort((a, b) => {
    if (a.region_number !== b.region_number)
      return a.region_number - b.region_number;
    if (a.tract_number !== b.tract_number)
      return a.tract_number - b.tract_number;
    return a.plot_number - b.plot_number;
  });

  // Group staked cards by deed_uid from card collection
  // Cards are staked if stake_end_date is null/undefined or in the future
  const now = new Date();
  const stakedCardsByDeed = new Map<string, string[]>();

  cardCollection.forEach((card) => {
    if (card.stake_ref_uid && card.card_detail_id !== 505) {
      //Exclude Runi cards
      const isStaked =
        !card.stake_end_date || new Date(card.stake_end_date) > now;
      if (isStaked) {
        const deedCards = stakedCardsByDeed.get(card.stake_ref_uid) || [];
        deedCards.push(card.uid);
        stakedCardsByDeed.set(card.stake_ref_uid, deedCards);
      }
    }
  });

  // Map to optimized deed structure
  const deeds: PlaygroundDeed[] = sortedDeeds.map((deed) => {
    // Get staked cards for this deed
    const workerUids = stakedCardsByDeed.get(deed.deed_uid) || [];

    // Determine power core tier from runi_boost
    let runi: RuniTier = "none";
    if (
      deed.stakingDetail?.runi_boost &&
      deed.stakingDetail.total_runi_boost_pp
    ) {
      runi =
        deed.stakingDetail.total_runi_boost_pp > RUNI_FLAT_ADD.regular
          ? "regular"
          : "gold";
    }

    const titleBoost = deed.stakingDetail?.title_boost;
    const titleTier: TitleTier = titleBoost
      ? (Object.entries(titleModifiers).find(
          ([, boostValue]) => boostValue === titleBoost
        )?.[0] as TitleTier) || "none"
      : "none";

    const totemBoost = deed.stakingDetail?.totem_boost;
    const totemTier: TotemTier = totemBoost
      ? (Object.entries(totemModifiers).find(
          ([, boostValue]) => boostValue === totemBoost
        )?.[0] as TotemTier) || "none"
      : "none";

    // Create SlotInput for each worker
    const createSlotInput = (uid: string | null): SlotInput | null => {
      if (!uid) return null;

      const card = cardCollection.find((c) => c.uid === uid);
      if (!card) return null;

      const splCard = cardDetails.find((cd) => cd.id === card.card_detail_id);
      const setName = card.card_set ?? "chaos";
      const rarity = cardRarityOptions[
        (splCard?.rarity ?? 1) - 1
      ] as CardRarity;
      const foil = cardFoilOptions[card.foil] || "regular";
      const color = splCard?.color.toLowerCase() ?? "red";
      const element = cardElementColorMap[color];
      const bcx = determineBcxCap(setName, rarity, card.foil, card.bcx);
      const bloodline = (splCard?.sub_type ?? "Unknown") as CardBloodline;

      return {
        id: 0, // Will be overridden by slot index
        set: setName as CardSetNameLandValid,
        rarity,
        bcx,
        foil,
        element,
        bloodline,
        uid, // Store the card UID for tracking
      };
    };

    return {
      deed_uid: deed.deed_uid,
      region_number: deed.region_number,
      tract_number: deed.tract_number,
      plot_number: deed.plot_number,
      rarity: (deed.rarity || "") as PlotRarity,
      plotStatus: (deed.plot_status || "natural") as PlotStatus,
      magicType: (deed.magic_type || null) as MagicType,
      resource: deed.resource_symbol as Resource,
      deedType: (deed.deed_type?.toLowerCase() || "bog") as DeedType,
      worksiteType: (deed.worksite_type || "") as WorksiteType,
      basePP: deed.stakingDetail?.total_base_pp_after_cap || 0,
      boostedPP: deed.stakingDetail?.total_boost_pp || 0,
      runi,
      titleTier,
      totemTier,
      worker1Uid: createSlotInput(workerUids[0]),
      worker2Uid: createSlotInput(workerUids[1]),
      worker3Uid: createSlotInput(workerUids[2]),
      worker4Uid: createSlotInput(workerUids[3]),
      worker5Uid: createSlotInput(workerUids[4]),
    };
  });

  // Map and sort cards by land_base_pp
  const cards: PlaygroundCard[] = cardCollection
    .map((card) => {
      const { name, rarity } = determineCardInfo(
        card.card_detail_id,
        cardDetails
      );
      const basePP = card.land_base_pp;

      const splCard = cardDetails.find((cd) => cd.id === card.card_detail_id);

      return {
        uid: card.uid,
        card_detail_id: card.card_detail_id,
        name: name,
        set: editionMap[card.edition].setName as CardSetName,
        rarity: rarity.toLowerCase() as CardRarity,
        element: cardElementColorMap[
          splCard?.color?.toLowerCase() ?? "red"
        ] as CardElement,
        subElement: cardElementColorMap[
          splCard?.secondary_color?.toLowerCase() ?? "red"
        ] as CardElement,
        land_base_pp: basePP,
        last_used_date: card.last_used_date || null,
        bcx: card.bcx,
        foil: cardFoilOptions[card.foil] || "regular",
        level: card.level,
      };
    })
    .sort((a, b) => b.land_base_pp - a.land_base_pp); // Highest PP first

  // Calculate total boosted PP
  const totalBoostedPP = deeds.reduce((sum, deed) => {
    return sum + deed.boostedPP;
  }, 0);

  return {
    deeds,
    cards,
    totalBoostedPP,
  };
}
