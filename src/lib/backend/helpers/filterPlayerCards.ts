import { findCardRarity as findCardRarity } from "@/lib/utils/cardUtil";
import { CardFilterInput, Tri } from "@/types/filters";
import { CardSetName, cardSetOptions } from "@/types/planner";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";

/**
 * Helper to test tri-state filter logic.
 */
const boolTest = (cond: boolean, mode: Tri | undefined): boolean => {
  if (!mode || mode === "all") return true;
  return mode === "only" ? cond : !cond;
};

/**
 * Returns a filtered array of SplPlayerCardCollection based on CardFilters.
 */
export function filterCardCollection(
  cards: SplPlayerCardCollection[],
  cardDetails: SplCardDetails[],
  filters?: CardFilterInput,
): SplPlayerCardCollection[] {
  const {
    filter_on_land = "all",
    filter_in_set = "all",
    filter_on_wagon = "all",
    filter_set,
    filter_rarity,
  } = filters ?? {};

  return cards.filter((c) => {
    // Exclude special cards like "Soulbound / Foundation / extra"
    if (!cardSetOptions.includes(c.card_set)) return false;
    const rarityName = findCardRarity(cardDetails, c.card_detail_id);

    // Exclude cards with no land base pp
    if (c.land_base_pp == null || c.land_base_pp <= 0) return false;

    // onLand
    const isOnLand = c.stake_plot != null && c.stake_end_date == null;
    if (!boolTest(isOnLand, filter_on_land)) return false;

    // inSet
    const isInSet = c.set_id != null;
    if (!boolTest(isInSet, filter_in_set)) return false;

    // onWagon
    const hasWagon = c.wagon_uid != null;
    if (!boolTest(hasWagon, filter_on_wagon)) return false;

    // filter_set
    if (filter_set && filter_set.length > 0) {
      if (!filter_set.includes(c.card_set as CardSetName)) return false;
    }

    // filter_rarity
    if (filter_rarity && filter_rarity.length > 0) {
      if (!filter_rarity.includes(rarityName)) return false;
    }

    return true;
  });
}
