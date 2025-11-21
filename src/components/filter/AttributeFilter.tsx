"use client";

import { useFilters } from "@/lib/frontend/context/FilterContext";
import { FilterInput } from "@/types/filters";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import FilterDeedTypeGroup from "./deed-type/FilterDeedTypeGroup";
import FilterPlotStatusGroup from "./plot-status/FilterPlotStatusGroup";
import FilterRarityGroup from "./rarity/FilterRarityGroup";
import FilterResourceGroup from "./resource/FilterResourceGroup";
import { PPRangeFilter } from "./PPRangeFilter";

type Props = {
  options: FilterInput;
};

type BooleanFilterKey = "filter_developed" | "filter_under_construction";

export default function AttributeFilter({ options }: Props) {
  const { filters, setFilters } = useFilters();

  const toggleBoolean = (key: BooleanFilterKey) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (prev[key]) {
        delete newFilters[key];
      } else {
        newFilters[key] = true;
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

      <FormGroup sx={{ mt: 2 }}>
        {(
          [
            "filter_developed",
            "filter_under_construction",
          ] as BooleanFilterKey[]
        ).map((key) => (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                checked={filters?.[key] === true}
                onChange={() => toggleBoolean(key)}
                size="small"
              />
            }
            label={key
              .replace("filter_", "")
              .replace(/_/g, " ")
              .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())}
          />
        ))}
      </FormGroup>
    </Box>
  );
}
