import { findCardRarity as findCardRarity } from "@/lib/utils/cardUtil";
import { CardFilterInput, Tri } from "@/types/filters";
import {
  CardSetName,
  cardSetOptions,
  SOULBOUND_EDITIONS,
} from "@/types/planner";
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
    // 0) Exclude special/unsupported sets
    if (!cardSetOptions.includes(c.card_set as CardSetName)) return false;

    // 1) Edition-specific rule: editions 10/13/16 must be fully unlocked
    //    i.e., bcx_unbound must equal bcx (otherwise return false)
    if (SOULBOUND_EDITIONS.has(c.edition)) {
      if (c.bcx_unbound == null || c.bcx == null) return false;
      if (c.bcx_unbound !== c.bcx) return false;
    }

    // 2) Exclude cards with no land base pp
    if (c.land_base_pp == null || c.land_base_pp <= 0) return false;

    // 3) Rarity (resolve once; used below)
    const rarityName = findCardRarity(cardDetails, c.card_detail_id);

    // 4) onLand
    const isOnLand = c.stake_plot != null && c.stake_end_date == null;
    if (!boolTest(isOnLand, filter_on_land)) return false;

    // 5) inSet
    const isInSet = c.set_id != null;
    if (!boolTest(isInSet, filter_in_set)) return false;

    // 6) onWagon
    const hasWagon = c.wagon_uid != null;
    if (!boolTest(hasWagon, filter_on_wagon)) return false;

    // 7) filter_set
    if (filter_set?.length) {
      if (!filter_set.includes(c.card_set as CardSetName)) return false;
    }

    // 8) filter_rarity
    if (filter_rarity?.length) {
      if (!filter_rarity.includes(rarityName)) return false;
    }

    return true;
  });
}
