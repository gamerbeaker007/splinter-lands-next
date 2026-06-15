import { CROSS_ERA_EDITIONS } from "@/types/editions";
import { CardFilterOptions } from "@/types/cardFilter";
import { PlayerLandCard } from "@/types/playerLandCard";

/**
 * Feature-neutral card filtering shared by the planning Playground and the
 * Land Manager Production worker picker. Keep free of feature-specific concepts
 * (deeds, plots) so it survives the Playground being removed.
 */

/** True when a cooldown date is set and still in the future. */
export function isCooldownActive(date: string | null): boolean {
  if (!date) return false;
  const t = new Date(date).getTime();
  return Number.isFinite(t) && Date.now() <= t;
}

/** Whole days since a date; Infinity when never used (passes "not used in N days"). */
function daysSince(date: string | null): number {
  if (!date) return Infinity;
  const t = new Date(date).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

/**
 * Filters available cards based on assigned cards and card filter options
 */
export function filterAvailableCards(
  cards: PlayerLandCard[],
  assignedCardIds: Set<string>,
  cardFilterOptions: CardFilterOptions
): PlayerLandCard[] {
  // Filter out assigned cards
  let filtered = cards.filter((card) => !assignedCardIds.has(card.uid));

  // Filter out Runi (no workers)
  filtered = filtered.filter((card) => card.cardDetailId !== 505);

  // Apply card filters
  if (cardFilterOptions.onWagon !== undefined) {
    filtered = filtered.filter((card) =>
      cardFilterOptions.onWagon ? card.onWagon : !card.onWagon
    );
  }

  if (cardFilterOptions.inSet !== undefined) {
    filtered = filtered.filter((card) =>
      cardFilterOptions.inSet ? card.inSet : !card.inSet
    );
  }

  if (cardFilterOptions.isListed !== undefined) {
    filtered = filtered.filter((card) =>
      cardFilterOptions.isListed ? card.isListed : !card.isListed
    );
  }
  if (cardFilterOptions.owned !== undefined) {
    filtered = filtered.filter((card) =>
      cardFilterOptions.owned ? card.owned : !card.owned
    );
  }

  if (cardFilterOptions.delegated !== undefined) {
    filtered = filtered.filter((card) =>
      cardFilterOptions.delegated ? card.delegated : !card.delegated
    );
  }

  if (cardFilterOptions.landCooldown !== undefined) {
    filtered = filtered.filter(
      (card) =>
        isCooldownActive(card.landCooldownDate) ===
        cardFilterOptions.landCooldown
    );
  }

  if (cardFilterOptions.survivalCooldown !== undefined) {
    filtered = filtered.filter(
      (card) =>
        isCooldownActive(card.survivalDate) ===
        cardFilterOptions.survivalCooldown
    );
  }

  if (cardFilterOptions.lastUsedDays && cardFilterOptions.lastUsedDays > 0) {
    filtered = filtered.filter(
      (card) => daysSince(card.lastUsedDate) >= cardFilterOptions.lastUsedDays!
    );
  }

  if (cardFilterOptions.rarities.length > 0) {
    filtered = filtered.filter((card) =>
      cardFilterOptions.rarities.includes(card.rarity)
    );
  }

  if (cardFilterOptions.sets.length > 0) {
    filtered = filtered.filter((card) =>
      cardFilterOptions.sets.includes(card.set)
    );
  }

  const hasEditionFilter =
    cardFilterOptions.editions.length > 0 ||
    cardFilterOptions.promoSets.length > 0 ||
    cardFilterOptions.rewardSets.length > 0 ||
    cardFilterOptions.extraSets.length > 0;
  if (hasEditionFilter) {
    filtered = filtered.filter((card) => {
      // Cross-era editions are matched by the card's era set; native editions
      // by their (set-unique) edition id.
      if (card.edition === CROSS_ERA_EDITIONS.promo)
        return cardFilterOptions.promoSets.includes(card.set);
      if (card.edition === CROSS_ERA_EDITIONS.reward)
        return cardFilterOptions.rewardSets.includes(card.set);
      if (card.edition === CROSS_ERA_EDITIONS.extra)
        return cardFilterOptions.extraSets.includes(card.set);
      return cardFilterOptions.editions.includes(card.edition);
    });
  }

  if (cardFilterOptions.elements.length > 0) {
    filtered = filtered.filter((card) =>
      cardFilterOptions.elements.includes(card.element)
    );
  }

  if (cardFilterOptions.foils.length > 0) {
    filtered = filtered.filter((card) =>
      cardFilterOptions.foils.includes(card.foil)
    );
  }

  if (cardFilterOptions.minPP > 0) {
    filtered = filtered.filter(
      (card) => card.landBasePP >= cardFilterOptions.minPP
    );
  }

  return filtered;
}
