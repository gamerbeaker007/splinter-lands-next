import { findCardRarity } from "@/lib/utils/cardUtil";
import { CardFilterInput } from "@/types/filters";
import {
  CardSetName,
  cardSetOptions,
  SOULBOUND_EDITIONS,
} from "@/types/planner";
import { SplCardDetails } from "@/types/splCardDetails";
import { SplPlayerCardCollection } from "@/types/splPlayerCardDetails";

/**
 * Returns a filtered array of SplPlayerCardCollection based on CardFilters.
 */

// Helper function for boolean filters: returns true if filter is null, otherwise compares value
function boolTest(value: boolean, filter: boolean | null | undefined): boolean {
  if (filter == null) return true;
  return value === filter;
}

export function filterCardCollection(
  cards: SplPlayerCardCollection[],
  cardDetails: SplCardDetails[],
  player: string,
  filters?: CardFilterInput,
): SplPlayerCardCollection[] {
  const {
    filter_on_land,
    filter_in_set,
    filter_on_wagon,
    filter_delegated,
    filter_owned,
    filter_set,
    filter_rarity,
    filter_last_used,
    filter_land_cooldown,
    filter_survival_cooldown,
  } = filters ?? {};

  return cards.filter((c) => {
    //  Exclude special/unsupported sets
    if (!cardSetOptions.includes(c.card_set as CardSetName)) return false;

    // Edition-specific rule: editions 10/13/16 must be fully unlocked
    //    i.e., bcx_unbound must equal bcx (otherwise return false)
    if (SOULBOUND_EDITIONS.has(c.edition)) {
      if (c.bcx_unbound == null || c.bcx == null) return false;
      if (c.bcx_unbound !== c.bcx) return false;
    }

    // Exclude cards with no land base pp
    if (c.land_base_pp == null || c.land_base_pp <= 0) return false;

    // Rarity (resolve once; used below)
    const rarityName = findCardRarity(cardDetails, c.card_detail_id);

    // onLand
    const isOnLand = c.stake_plot != null && c.stake_end_date == null;
    if (!boolTest(isOnLand, filter_on_land)) return false;

    // inSet
    const isInSet = c.set_id != null;
    if (!boolTest(isInSet, filter_in_set)) return false;

    // onWagon
    const hasWagon = c.wagon_uid != null;
    if (!boolTest(hasWagon, filter_on_wagon)) return false;

    // filter_delegated
    const hasDelegated = c.delegated_to != null;
    if (!boolTest(hasDelegated, filter_delegated)) return false;

    // filter_delegated
    const isOwner = c.player == player;
    if (!boolTest(isOwner, filter_owned)) return false;

    // filter_set
    if (filter_set?.length) {
      if (!filter_set.includes(c.card_set as CardSetName)) return false;
    }

    //  filter_rarity
    if (filter_rarity?.length) {
      if (!filter_rarity.includes(rarityName)) return false;
    }

    //  filter_land_cooldown
    const stakeEndDate = c.stake_end_date;
    if (filter_land_cooldown != null) {
      if (stakeEndDate == null) return !filter_land_cooldown;

      const today = new Date().getTime();
      const date = new Date(stakeEndDate).getTime();
      return filter_land_cooldown ? today <= date : today >= date;
    }

    //  filter_survival_cooldown
    const survivalDate = c.survival_date;
    if (filter_survival_cooldown != null) {
      if (survivalDate == null) return !filter_survival_cooldown;

      const today = new Date().getTime();
      const date = new Date(survivalDate).getTime();
      return filter_survival_cooldown ? today <= date : today >= date;
    }

    //  filter_last_used
    const lastUsedDate = c.last_used_date;
    if (filter_last_used && lastUsedDate != null) {
      // null value are considered to be viewed always
      const today = new Date();

      const diffTime = today.getTime() - new Date(lastUsedDate).getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); //divide by the number of milliseconds in one day

      // If the difference in days is greater than the filter, the item will be included.
      return diffDays >= filter_last_used;
    }

    return true;
  });
}
