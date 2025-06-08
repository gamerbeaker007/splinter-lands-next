import { FilterInput } from "@/types/filters";
import { DeedComplete } from "@/types/deed";

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
      const isUnderConstruction =
        (deed.worksiteDetail?.is_construction ?? false) === true;
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
