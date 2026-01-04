import { CardFilterOptions } from "@/types/cardFilter";
import {
  DeedFilterOptions,
  PlaygroundCard,
  PlaygroundDeed,
} from "@/types/playground";

/**
 * Filters deeds based on the provided filter options
 */
export function filterDeeds(
  deeds: PlaygroundDeed[],
  filterOptions: DeedFilterOptions
): PlaygroundDeed[] {
  return deeds.filter((deed) => {
    // Region filter
    if (
      filterOptions.regions.length > 0 &&
      !filterOptions.regions.includes(deed.region_number)
    ) {
      return false;
    }

    // Tract filter
    if (
      filterOptions.tracts.length > 0 &&
      !filterOptions.tracts.includes(deed.tract_number)
    ) {
      return false;
    }

    // Plot filter
    if (
      filterOptions.plots.length > 0 &&
      !filterOptions.plots.includes(deed.plot_number)
    ) {
      return false;
    }

    // Rarity filter
    if (
      filterOptions.rarities.length > 0 &&
      !filterOptions.rarities.includes(deed.rarity)
    ) {
      return false;
    }

    // Status filter
    if (
      filterOptions.statuses.length > 0 &&
      !filterOptions.statuses.includes(deed.plotStatus)
    ) {
      return false;
    }

    // Terrain filter
    if (
      filterOptions.terrains.length > 0 &&
      !filterOptions.terrains.includes(deed.deedType)
    ) {
      return false;
    }

    // Worksite filter
    if (
      filterOptions.worksites.length > 0 &&
      !filterOptions.worksites.includes(deed.worksiteType)
    ) {
      return false;
    }

    // Under construction filter
    if (filterOptions.underConstruction && !deed.isConstruction) {
      return false;
    }

    // Developed filter (undeveloped means empty worksiteType)
    if (filterOptions.developed && deed.worksiteType !== "") {
      return false;
    }

    // Max workers filter
    if (filterOptions.maxWorkers !== null) {
      const workerCount = [
        deed.worker1Uid,
        deed.worker2Uid,
        deed.worker3Uid,
        deed.worker4Uid,
        deed.worker5Uid,
      ].filter((w) => w !== null).length;
      if (workerCount > filterOptions.maxWorkers) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filters available cards based on assigned cards and card filter options
 */
export function filterAvailableCards(
  cards: PlaygroundCard[],
  assignedCardIds: Set<string>,
  cardFilterOptions: CardFilterOptions
): PlaygroundCard[] {
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
