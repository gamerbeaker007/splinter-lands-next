"use client";

import { useFilters } from "@/lib/frontend/context/FilterContext";
import { FilterInput } from "@/types/filters";
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import FilterDeedTypeGroup from "./deed-type/FilterDeedTypeGroup";
import FilterPlotStatusGroup from "./plot-status/FilterPlotStatusGroup";
import { PPRangeFilter } from "./PPRangeFilter";
import FilterRarityGroup from "./rarity/FilterRarityGroup";
import FilterResourceGroup from "./resource/FilterResourceGroup";
import FilterWorksiteGroup from "./worksite/FilterWorksiteGroup";

type Props = {
  options: FilterInput;
};

type BooleanFilterKey =
  | "filter_developed"
  | "filter_under_construction"
  | "filter_has_land_ability";

const BOOLEAN_FILTER_LABELS: Record<BooleanFilterKey, string> = {
  filter_developed: "Developed",
  filter_under_construction: "Under construction",
  filter_has_land_ability: "Has land ability",
};

/** undefined = "any" (no filter), true = "yes", false = "no" */
function triStateValue(v: boolean | undefined): "any" | "yes" | "no" {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "any";
}

export default function AttributeFilter({ options }: Props) {
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

      <Stack gap={1.5} sx={{ mt: 2 }}>
        {(
          [
            "filter_developed",
            "filter_under_construction",
            "filter_has_land_ability",
          ] as BooleanFilterKey[]
        ).map((key) => (
          <Box key={key}>
            <Typography variant="caption" color="text.secondary">
              {BOOLEAN_FILTER_LABELS[key]}
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              fullWidth
              value={triStateValue(filters[key])}
              onChange={(_, v) => {
                if (v) setBoolean(key, v as "any" | "yes" | "no");
              }}
            >
              <ToggleButton value="any">Any</ToggleButton>
              <ToggleButton value="yes">Yes</ToggleButton>
              <ToggleButton value="no">No</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
