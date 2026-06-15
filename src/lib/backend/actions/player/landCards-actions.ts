"use server";

import { getCachedCardDetailsData } from "@/lib/backend/services/cardService";
import { getCachedPlayerCardCollection } from "@/lib/backend/services/playerService";
import { determineCardInfo, determineLandBoosts } from "@/lib/utils/cardUtil";
import { CardSetName } from "@/types/editions";
import {
  CardElement,
  cardElementColorMap,
  cardFoilOptions,
  CardRarity,
} from "@/types/planner";
import { PlayerLandCard } from "@/types/playerLandCard";
import { filterCardCollection } from "../../helpers/filterPlayerCards";

/**
 * Fetch a player's land-eligible cards, normalized for display and scoring.
 *
 * Feature-neutral: used by both the planning Playground and the Land Manager
 * Production worker picker. Returns cards sorted by land base PP (highest
 * first). Non-land cards are filtered out.
 */
export async function getPlayerLandCards(
  player: string
): Promise<PlayerLandCard[]> {
  if (!player) {
    throw new Error("Player parameter is required");
  }

  const [cardCollection, cardDetails] = await Promise.all([
    getCachedPlayerCardCollection(player),
    getCachedCardDetailsData(),
  ]);

  // First filter out all non-land cards from the collection.
  const filteredCardCollection = filterCardCollection(
    cardCollection,
    cardDetails,
    player
  );

  return filteredCardCollection
    .map((card) => {
      const { name, rarity } = determineCardInfo(
        card.card_detail_id,
        cardDetails
      );
      const basePP = Number(card.land_base_pp);

      const splCard = cardDetails.find((cd) => cd.id === card.card_detail_id);
      const foil = cardFoilOptions[card.foil] || "regular";
      const landBoost = determineLandBoosts(rarity, foil, card.bcx, splCard);

      return {
        uid: card.uid,
        cardDetailId: card.card_detail_id,
        name: name,
        edition: card.edition,
        set: card.card_set as CardSetName,
        rarity: rarity.toLowerCase() as CardRarity,
        element: cardElementColorMap[
          splCard?.color?.toLowerCase() ?? "red"
        ] as CardElement,
        // null when the card has no secondary color — defaulting to a real
        // element here would give single-color cards a phantom terrain boost.
        subElement: splCard?.secondary_color
          ? ((cardElementColorMap[
              splCard.secondary_color.toLowerCase()
            ] as CardElement) ?? null)
          : null,
        landBasePP: basePP,
        lastUsedDate: card.last_used_date || null,
        bcx: card.bcx,
        bcxUnbound: card.bcx_unbound,
        foil: foil,
        level: card.level,
        landBoost,
        inSet: card.set_id !== null,
        isListed: card.market_listing_type !== null,
        onWagon: card.wagon_uid !== null,
        onLand: card.stake_plot != null && card.stake_end_date == null,
        owned: card.player === player,
        delegated: card.delegated_to != null,
        landCooldownDate: card.stake_end_date ?? null,
        survivalDate: card.survival_date ?? null,
      };
    })
    .sort((a, b) => Number(b.landBasePP) - Number(a.landBasePP)); // Highest PP first
}
