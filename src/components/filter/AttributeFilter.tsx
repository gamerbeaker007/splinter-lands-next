"use client";

import { useFilters } from "@/lib/frontend/context/FilterContext";
import {
  EnableFilterOptions,
  FilterInput,
  PoweredFilter,
  WorkerFilter,
} from "@/types/filters";
import { Box, MenuItem, Select, Stack, Typography } from "@mui/material";
import FilterDeedTypeGroup from "./deed-type/FilterDeedTypeGroup";
import FilterPlotStatusGroup from "./plot-status/FilterPlotStatusGroup";
import { PPRangeFilter } from "./PPRangeFilter";
import FilterRarityGroup from "./rarity/FilterRarityGroup";
import FilterResourceGroup from "./resource/FilterResourceGroup";
import FilterTerrainBoostGroup from "./terrain-boost/FilterTerrainBoostGroup";
import FilterTitleGroup from "./title/FilterTitleGroup";
import FilterTotemGroup from "./totem/FilterTotemGroup";
import TriStateBooleanFilter from "./TriStateBooleanFilter";
import FilterWorksiteGroup from "./worksite/FilterWorksiteGroup";

type Props = {
  options: FilterInput;
  filtersEnabled?: Partial<EnableFilterOptions>;
};

type BooleanFilterKey =
  | "filter_developed"
  | "filter_under_construction"
  | "filter_has_land_ability"
  | "filter_has_runi";

const BOOLEAN_FILTER_LABELS: Record<BooleanFilterKey, string> = {
  filter_developed: "Developed",
  filter_under_construction: "Under construction",
  filter_has_land_ability: "Has land ability",
  filter_has_runi: "Has Runi",
};

export default function AttributeFilter({ options, filtersEnabled }: Props) {
  const { filters, setFilters } = useFilters();

  const setBoolean = (key: BooleanFilterKey, next: "any" | "yes" | "no") => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (next === "any") {
        delete newFilters[key];
      } else {
        newFilters[key] = next === "yes";
      }
      return newFilters;
    });
  };

  const updateBasePP = (min?: number | null, max?: number | null) => {
    setFilters((prev) => ({
      ...prev,
      filter_base_pp_min: min ?? null,
      filter_base_pp_max: max ?? null,
    }));
  };

  const updateBoostedPP = (min?: number | null, max?: number | null) => {
    setFilters((prev) => ({
      ...prev,
      filter_boosted_pp_min: min ?? null,
      filter_boosted_pp_max: max ?? null,
    }));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Attributes
      </Typography>

      <FilterRarityGroup options={options.filter_rarity ?? []} />
      <FilterResourceGroup options={options.filter_resources ?? []} />
      <FilterWorksiteGroup options={options.filter_worksites ?? []} />
      <FilterDeedTypeGroup options={options.filter_deed_type ?? []} />
      <FilterPlotStatusGroup options={options.filter_plot_status ?? []} />
      <FilterTitleGroup options={options.filter_title_tier ?? []} />
      <FilterTotemGroup options={options.filter_totem_tier ?? []} />
      <FilterTerrainBoostGroup options={options.filter_terrain_boosts ?? []} />

      {/* New PP min/max */}
      <Typography variant="subtitle2" sx={{ mt: 2 }}>
        Base PP
      </Typography>
      <PPRangeFilter
        min={filters.filter_base_pp_min ?? null}
        max={filters.filter_base_pp_max ?? null}
        onChange={updateBasePP}
      />
      <Typography variant="subtitle2" sx={{ mt: 2 }}>
        Boosted PP
      </Typography>
      <PPRangeFilter
        min={filters.filter_boosted_pp_min ?? null}
        max={filters.filter_boosted_pp_max ?? null}
        onChange={updateBoostedPP}
      />

      <Stack gap={1} sx={{ mt: 1.5 }}>
        {(
          [
            "filter_developed",
            "filter_under_construction",
            "filter_has_land_ability",
            "filter_has_runi",
          ] as BooleanFilterKey[]
        ).map((key) => (
          <TriStateBooleanFilter
            key={key}
            label={BOOLEAN_FILTER_LABELS[key]}
            value={filters[key]}
            onChange={(v) => setBoolean(key, v)}
          />
        ))}
      </Stack>

      {filtersEnabled?.poweredWorkers && (
        <Stack gap={1.5} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Powered
            </Typography>
            <Select
              size="small"
              fullWidth
              value={filters.filter_powered ?? "all"}
              onChange={(e) => {
                const v = e.target.value;
                if (v)
                  setFilters((prev) => ({
                    ...prev,
                    filter_powered: v as PoweredFilter,
                  }));
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="powered">Powered</MenuItem>
              <MenuItem value="unpowered">Unpowered</MenuItem>
            </Select>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Workers
            </Typography>
            <Select
              size="small"
              fullWidth
              value={filters.filter_workers ?? "all"}
              onChange={(e) => {
                const v = e.target.value;
                if (v)
                  setFilters((prev) => ({
                    ...prev,
                    filter_workers: v as WorkerFilter,
                  }));
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="hasWorkers">Has workers</MenuItem>
              <MenuItem value="hasEmptySlots">Has empty worker slots</MenuItem>
              <MenuItem value="fullyEmpty">Has no workers</MenuItem>
            </Select>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
