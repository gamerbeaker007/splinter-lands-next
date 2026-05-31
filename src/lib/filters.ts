import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import { RentalEligiblePlot } from "@/types/landManager";
import { SortDirection, SortOptionKey } from "@/types/sorting";

/**
 * Parse deed.land_stats (Json? — may be a string or already an object) into a list
 * of upper-cased resource symbols, e.g. ["WOOD"]. Returns [] on any parse failure.
 */
export function parseLandStatsResources(landStats: unknown): string[] {
  if (!landStats) return [];
  try {
    const obj =
      typeof landStats === "string" ? JSON.parse(landStats) : landStats;
    const resources = (obj as Record<string, unknown>)?.resources;
    if (Array.isArray(resources)) {
      return resources.map((r) => String(r).toUpperCase());
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

export function filterDeeds(
  data: DeedComplete[],
  filters: FilterInput
): DeedComplete[] {
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
        (deed.stakingDetail?.dec_stake_needed_discount ?? 0) > 0 ||
        (deed.stakingDetail?.grain_food_discount ?? 0) > 0 ||
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

/**
 * Client-side filter for RentalEligiblePlot lists.
 * Mirrors the filterDeeds logic but operates on the rental-specific type.
 * Centralized here to avoid duplicating filter logic across components.
 */
export function filterRentalPlots(
  plots: RentalEligiblePlot[],
  filters: FilterInput
): RentalEligiblePlot[] {
  return plots.filter((p) => {
    if (
      filters.filter_regions?.length &&
      !filters.filter_regions.includes(p.region_number)
    )
      return false;

    // Natural resource: from land_stats (the canonical "what this land produces")
    const resource = p.resources[0] ?? undefined;
    if (
      filters.filter_resources?.length &&
      !filters.filter_resources.includes(resource ?? "")
    )
      return false;

    // Worksite: the built structure type (e.g. "Grain Farm")
    if (
      filters.filter_worksites?.length &&
      !filters.filter_worksites.includes(p.worksite ?? "")
    )
      return false;

    if (
      filters.filter_rarity?.length &&
      !filters.filter_rarity.includes(p.rarity ?? "")
    )
      return false;
    if (
      filters.filter_deed_type?.length &&
      !filters.filter_deed_type.includes(p.deed_type ?? "")
    )
      return false;
    if (
      filters.filter_plot_status?.length &&
      !filters.filter_plot_status.includes(p.plot_status ?? "")
    )
      return false;

    return true;
  });
}
