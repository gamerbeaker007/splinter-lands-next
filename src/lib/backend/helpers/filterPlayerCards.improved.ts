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
 * Filter result for debugging and combining filters
 */
interface FilterResult {
  passed: boolean;
  reason?: string;
}

/**
 * Collection of all filter results for a card
 */
interface CardFilterResults {
  card: SplPlayerCardCollection;
  validSet: FilterResult;
  soulboundRule: FilterResult;
  hasBasePP: FilterResult;
  onLand: FilterResult;
  inSet: FilterResult;
  onWagon: FilterResult;
  delegated: FilterResult;
  owned: FilterResult;
  setFilter: FilterResult;
  rarityFilter: FilterResult;
  landCooldown: FilterResult;
  survivalCooldown: FilterResult;
  lastUsed: FilterResult;
  // Computed overall result
  overallPassed: boolean;
  failureReasons: string[];
}

/**
 * Helper function for boolean filters: returns true if filter is null, otherwise compares value
 */
function boolTest(
  value: boolean,
  filter: boolean | null | undefined,
  testName: string,
): FilterResult {
  if (filter == null) return { passed: true };
  const passed = value === filter;
  return {
    passed,
    reason: passed
      ? undefined
      : `${testName}: expected ${filter}, got ${value}`,
  };
}

/**
 * Apply individual filter checks and store results
 */
function applyFilterChecks(
  card: SplPlayerCardCollection,
  cardDetails: SplCardDetails[],
  player: string,
  filters: CardFilterInput,
): CardFilterResults {
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
  } = filters;

  // Basic validation filters (always applied)
  const validSet: FilterResult = {
    passed: cardSetOptions.includes(card.card_set as CardSetName),
    reason: cardSetOptions.includes(card.card_set as CardSetName)
      ? undefined
      : `Unsupported card set: ${card.card_set}`,
  };

  const soulboundRule: FilterResult = (() => {
    if (!SOULBOUND_EDITIONS.has(card.edition)) return { passed: true };

    if (card.bcx_unbound == null || card.bcx == null) {
      return { passed: false, reason: "Soulbound card missing BCX data" };
    }

    if (card.bcx_unbound !== card.bcx) {
      return { passed: false, reason: "Soulbound card not fully unlocked" };
    }

    return { passed: true };
  })();

  const hasBasePP: FilterResult = {
    passed: card.land_base_pp != null && card.land_base_pp > 0,
    reason:
      card.land_base_pp != null && card.land_base_pp > 0
        ? undefined
        : "Card has no land base PP",
  };

  // User-configurable filters (only applied if specified)
  const isOnLand = card.stake_plot != null && card.stake_end_date == null;
  const onLand = boolTest(isOnLand, filter_on_land, "onLand");

  const isInSet = card.set_id != null;
  const inSet = boolTest(isInSet, filter_in_set, "inSet");

  const hasWagon = card.wagon_uid != null;
  const onWagon = boolTest(hasWagon, filter_on_wagon, "onWagon");

  const hasDelegated = card.delegated_to != null;
  const delegated = boolTest(hasDelegated, filter_delegated, "delegated");

  const isOwner = card.player == player;
  const owned = boolTest(isOwner, filter_owned, "owned");

  // Array-based filters
  const setFilter: FilterResult = (() => {
    if (!filter_set?.length) return { passed: true };
    const passed = filter_set.includes(card.card_set as CardSetName);
    return {
      passed,
      reason: passed
        ? undefined
        : `Card set ${card.card_set} not in allowed sets: [${filter_set.join(", ")}]`,
    };
  })();

  const rarityFilter: FilterResult = (() => {
    if (!filter_rarity?.length) return { passed: true };
    const rarityName = findCardRarity(cardDetails, card.card_detail_id);
    const passed = filter_rarity.includes(rarityName);
    return {
      passed,
      reason: passed
        ? undefined
        : `Card rarity ${rarityName} not in allowed rarities: [${filter_rarity.join(", ")}]`,
    };
  })();

  // Date-based filters
  const landCooldown: FilterResult = (() => {
    if (filter_land_cooldown == null) return { passed: true };

    const stakeEndDate = card.stake_end_date;
    if (stakeEndDate == null) {
      const passed = !filter_land_cooldown;
      return {
        passed,
        reason: passed
          ? undefined
          : "Card has no stake end date but filter requires land cooldown",
      };
    }

    const today = new Date().getTime();
    const date = new Date(stakeEndDate).getTime();
    const passed = filter_land_cooldown ? today <= date : today >= date;

    return {
      passed,
      reason: passed
        ? undefined
        : `Land cooldown filter failed: expected ${filter_land_cooldown ? "active" : "inactive"} cooldown`,
    };
  })();

  const survivalCooldown: FilterResult = (() => {
    if (filter_survival_cooldown == null) return { passed: true };

    const survivalDate = card.survival_date;
    if (survivalDate == null) {
      const passed = !filter_survival_cooldown;
      return {
        passed,
        reason: passed
          ? undefined
          : "Card has no survival date but filter requires survival cooldown",
      };
    }

    const today = new Date().getTime();
    const date = new Date(survivalDate).getTime();
    const passed = filter_survival_cooldown ? today <= date : today >= date;

    return {
      passed,
      reason: passed
        ? undefined
        : `Survival cooldown filter failed: expected ${filter_survival_cooldown ? "active" : "inactive"} cooldown`,
    };
  })();

  const lastUsed: FilterResult = (() => {
    if (!filter_last_used) return { passed: true };

    const lastUsedDate = card.last_used_date;
    if (lastUsedDate == null) return { passed: true }; // null values pass

    const today = new Date();
    const diffTime = today.getTime() - new Date(lastUsedDate).getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const passed = diffDays >= filter_last_used;
    return {
      passed,
      reason: passed
        ? undefined
        : `Last used ${diffDays} days ago, filter requires ${filter_last_used}+ days`,
    };
  })();

  // Combine all filter results
  const allResults = [
    validSet,
    soulboundRule,
    hasBasePP,
    onLand,
    inSet,
    onWagon,
    delegated,
    owned,
    setFilter,
    rarityFilter,
    landCooldown,
    survivalCooldown,
    lastUsed,
  ];

  const failureReasons = allResults
    .filter((result) => !result.passed && result.reason)
    .map((result) => result.reason!);

  const overallPassed = allResults.every((result) => result.passed);

  return {
    card,
    validSet,
    soulboundRule,
    hasBasePP,
    onLand,
    inSet,
    onWagon,
    delegated,
    owned,
    setFilter,
    rarityFilter,
    landCooldown,
    survivalCooldown,
    lastUsed,
    overallPassed,
    failureReasons,
  };
}

/**
 * Returns a filtered array of SplPlayerCardCollection based on CardFilters.
 *
 * This improved version:
 * 1. Stores all filter results before making final decision
 * 2. Provides detailed reasons for why cards were filtered out
 * 3. Makes it easy to debug and understand filter behavior
 * 4. Allows for future extensions like OR logic, weighted filters, etc.
 */
export function filterCardCollection(
  cards: SplPlayerCardCollection[],
  cardDetails: SplCardDetails[],
  player: string,
  filters?: CardFilterInput,
): SplPlayerCardCollection[] {
  if (!filters) return cards;

  const results = cards.map((card) =>
    applyFilterChecks(card, cardDetails, player, filters),
  );

  // Optional: Log filtering statistics for debugging
  if (process.env.NODE_ENV === "development") {
    const totalCards = cards.length;
    const passedCards = results.filter((r) => r.overallPassed).length;
    const filteredCards = totalCards - passedCards;

    if (filteredCards > 0) {
      console.log(`Filtered ${filteredCards}/${totalCards} cards:`);

      // Count failure reasons
      const reasonCounts = new Map<string, number>();
      results.forEach((result) => {
        result.failureReasons.forEach((reason) => {
          reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
        });
      });

      reasonCounts.forEach((count, reason) => {
        console.log(`  - ${reason}: ${count} cards`);
      });
    }
  }

  return results
    .filter((result) => result.overallPassed)
    .map((result) => result.card);
}
