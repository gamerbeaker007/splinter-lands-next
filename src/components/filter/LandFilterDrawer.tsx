"use client";

import { getAvailableFilterValues } from "@/lib/backend/actions/filter/filter-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { countActiveFilters } from "@/lib/frontend/utils/activeFilterCount";
import { EnableFilterOptions, FilterInput } from "@/types/filters";
import { useEffect, useMemo, useState } from "react";
import AttributeFilter from "./AttributeFilter";
import LocationFilter from "./LocationFilter";
import FilterPanelShell from "./panel/FilterPanelShell";
import PlayerFilter from "./PlayerFilter";
import ResetFiltersButton from "./reset-filters/ResetFiltersButton";
import Sorting from "./Sorting";

type Props = {
  player?: string | null;
  filtersEnabled?: Partial<EnableFilterOptions>;
};

export default function LandFilterDrawer({ player, filtersEnabled }: Props) {
  const [availableOptions, setAvailableOptions] = useState<FilterInput | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const { filters, locationOverride } = useFilters();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await getAvailableFilterValues(player ?? null);
        if (!cancelled) setAvailableOptions(data);
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [player]);

  // Merge any location override on top of the fetched (site-wide) options.
  // Categorical filters always use the fetched options.
  const effectiveOptions = useMemo<FilterInput | null>(() => {
    if (!availableOptions) return null;
    if (!locationOverride) return availableOptions;
    return { ...availableOptions, ...locationOverride };
  }, [availableOptions, locationOverride]);

  // Sorting is a presentation choice, not a filter — keep it out of the badge.
  const activeCount = useMemo(
    () => countActiveFilters(filters, ["sorting"]),
    [filters]
  );

  return (
    <FilterPanelShell
      title="Filters"
      activeCount={activeCount}
      loading={loading}
      ready={effectiveOptions !== null}
      footer={<ResetFiltersButton />}
    >
      {effectiveOptions && (
        <>
          {(filtersEnabled?.regions !== false ||
            filtersEnabled?.tracts !== false ||
            filtersEnabled?.plots !== false) && (
            <LocationFilter
              options={effectiveOptions}
              showRegion={filtersEnabled?.regions ?? true}
              showTract={filtersEnabled?.tracts ?? true}
              showPlot={filtersEnabled?.plots ?? true}
            />
          )}
          {filtersEnabled?.attributes !== false && (
            <AttributeFilter
              options={effectiveOptions}
              filtersEnabled={filtersEnabled}
            />
          )}
          {filtersEnabled?.player !== false && (
            <PlayerFilter options={effectiveOptions} />
          )}

          {filtersEnabled?.sorting !== false && <Sorting />}
        </>
      )}
    </FilterPanelShell>
  );
}
