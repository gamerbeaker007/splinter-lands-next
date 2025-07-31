import { DeedComplete } from "@/types/deed";
import { FilterInput } from "@/types/filters";
import { SortOptionKey, SortDirection } from "@/types/sorting";

function isInFilter(
  filter: ReadonlyArray<string | number> | undefined,
  value: unknown,
): boolean {
  if (!filter?.length) return true;
  if (typeof value === "string" || typeof value === "number") {
    return filter.includes(value);
  }
  return false;
}

export function filterDeeds(
  data: DeedComplete[],
  filters: FilterInput,
): DeedComplete[] {
  return data.filter((deed) => {
    if (!isInFilter(filters.filter_regions, deed.region_number)) return false;
    if (!isInFilter(filters.filter_tracts, deed.tract_number)) return false;
    if (!isInFilter(filters.filter_plots, deed.plot_number)) return false;
    if (!isInFilter(filters.filter_rarity, deed.rarity)) return false;
    if (
      !isInFilter(filters.filter_resources, deed.worksiteDetail?.token_symbol)
    )
      return false;
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

    if (filters.filter_has_pp !== undefined) {
      const isPositive = (deed.stakingDetail?.total_harvest_pp ?? 0) > 0;
      if (filters.filter_has_pp !== isPositive) return false;
    }

    return true;
  });
}

export function sortDeeds(
  deeds: DeedComplete[],
  sorting?: { key: SortOptionKey; direction: SortDirection },
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
  key: SortOptionKey,
): string | number | undefined {
  switch (key) {
    case "regionNumber":
      return deed.region_number!;
    case "tractNumber":
      return deed.tract_number!;
    case "plotNumber":
      return deed.plot_number!;
    case "rawPP":
      return deed.stakingDetail?.total_base_pp_after_cap ?? 0;
    case "boostedPP":
      return deed.stakingDetail?.total_harvest_pp ?? 0;
    case "percentComplete":
      return deed.progressInfo?.percentageDone ?? 0;
    case "netDEC":
      return deed.productionIfo?.netDEC ?? 0;
    default:
      return undefined;
  }
}
