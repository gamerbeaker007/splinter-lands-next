import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import { SortDirection, SortOptionKey } from "@/types/sorting";

/**
 * land_stats.resources uses raw names that don't always match the canonical
 * resource symbols (e.g. "ore" → IRON). Aliases live here.
 */
const LAND_STATS_RESOURCE_ALIASES: Record<string, string> = {
  ORE: "IRON",
};

/**
 * Parse deed.land_stats (Json? — may be a string or already an object) into a list
 * of upper-cased resource symbols normalized to canonical names (e.g. "ORE" → "IRON").
 * Returns [] on any parse failure.
 */
export function parseLandStatsResources(landStats: unknown): string[] {
  if (!landStats) return [];
  try {
    const obj =
      typeof landStats === "string" ? JSON.parse(landStats) : landStats;
    const resources = (obj as Record<string, unknown>)?.resources;
    if (Array.isArray(resources)) {
      return resources.map((r) => {
        const upper = String(r).toUpperCase();
        return LAND_STATS_RESOURCE_ALIASES[upper] ?? upper;
      });
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

function isInFilter(
  filter: ReadonlyArray<string | number> | undefined,
  value: unknown
): boolean {
  if (!filter?.length) return true;
  if (typeof value === "string" || typeof value === "number") {
    return filter.includes(value);
  }
  return false;
}

function inRange(
  value: number | null | undefined,
  min?: number | null,
  max?: number | null
): boolean {
  // If both min/max are empty => no filtering
  const hasMin = typeof min === "number";
  const hasMax = typeof max === "number";
  if (!hasMin && !hasMax) return true;

  // If we need to filter but the value is missing, exclude
  if (value == null || Number.isNaN(value)) return false;

  if (hasMin && value < (min as number)) return false;
  if (hasMax && value > (max as number)) return false;
  return true;
}

export function filterDeeds<T extends DeedComplete>(
  data: T[],
  filters: FilterInput
): T[] {
  return data.filter((deed) => {
    if (!isInFilter(filters.filter_regions, deed.region_number)) return false;
    if (!isInFilter(filters.filter_tracts, deed.tract_number)) return false;
    if (!isInFilter(filters.filter_plots, deed.plot_number)) return false;
    if (!isInFilter(filters.filter_rarity, deed.rarity)) return false;
    const effectiveResource =
      deed.resource_symbol ?? parseLandStatsResources(deed.land_stats)[0];
    if (!isInFilter(filters.filter_resources, effectiveResource)) return false;
    if (!isInFilter(filters.filter_worksites, deed.worksite_type)) return false;
    if (!isInFilter(filters.filter_deed_type, deed.deed_type)) return false;
    if (!isInFilter(filters.filter_plot_status, deed.plot_status)) return false;
    if (!isInFilter(filters.filter_players, deed.player)) return false;

    if (filters.filter_developed !== undefined) {
      const isDeveloped = (deed.worksite_type ?? "") !== "";
      if (filters.filter_developed !== isDeveloped) return false;
    }

    if (filters.filter_under_construction !== undefined) {
      const isUnderConstruction = deed.worksiteDetail?.is_construction ?? false;
      if (filters.filter_under_construction !== isUnderConstruction)
        return false;
    }

    if (filters.filter_has_land_ability !== undefined) {
      const hasAnyLandAbilities =
        (deed.stakingDetail?.card_bloodlines_boost ?? 0) > 0 ||
        (deed.stakingDetail?.dec_stake_needed_discount ?? 0) < 0 ||
        (deed.stakingDetail?.grain_food_discount ?? 0) < 0 ||
        (deed.stakingDetail?.lite_food_discount ?? 0) < 0 ||
        (deed.stakingDetail?.card_abilities_boost ?? 0) > 0 ||
        (deed.stakingDetail?.is_energized ?? false) ||
        (deed.stakingDetail?.has_labors_luck ?? false);

      if (filters.filter_has_land_ability !== hasAnyLandAbilities) return false;
    }

    const basePP = deed.stakingDetail?.total_base_pp_after_cap;
    if (
      !inRange(
        basePP,
        filters.filter_base_pp_min ?? null,
        filters.filter_base_pp_max ?? null
      )
    ) {
      return false;
    }

    const boostedPP = deed.stakingDetail?.total_harvest_pp;
    if (
      !inRange(
        boostedPP,
        filters.filter_boosted_pp_min ?? null,
        filters.filter_boosted_pp_max ?? null
      )
    ) {
      return false;
    }

    return true;
  });
}

export function sortDeeds(
  deeds: DeedComplete[],
  sorting?: { key: SortOptionKey; direction: SortDirection }
): DeedComplete[] {
  if (!sorting) return deeds;

  return deeds.sort((a, b) => {
    const aVal = getSortValue(a, sorting.key);
    const bVal = getSortValue(b, sorting.key);

    // nulls at end
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sorting.direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sorting.direction === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });
}

function getSortValue(
  deed: DeedComplete,
  key: SortOptionKey
): string | number | undefined {
  switch (key) {
    case "regionNumber":
      return deed.region_number!;
    case "tractNumber":
      return deed.tract_number!;
    case "plotNumber":
      return deed.plot_number!;
    case "basePP":
      return deed.stakingDetail?.total_base_pp_after_cap ?? 0;
    case "boostedPP":
      return deed.stakingDetail?.total_harvest_pp ?? 0;
    case "percentComplete":
      return deed.progressInfo?.percentageDone ?? 0;
    case "netDEC":
      return deed.productionInfo?.netDEC ?? 0;
    default:
      return undefined;
  }
}
