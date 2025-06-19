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
import FilterRarityGroup from "./rarity/FilterRarityGroup";
import FilterResourceGroup from "./resource/FilterResourceGroup";
import FilterDeedTypeGroup from "./deed-type/FilterDeedTypeGroup";
import FilterPlotStatusGroup from "./plot-status/FilterPlotStatusGroup";

type Props = {
  options: FilterInput;
};

type BooleanFilterKey =
  | "filter_developed"
  | "filter_under_construction"
  | "filter_has_pp";

export default function AttributeFilter({ options }: Props) {
  const { filters, setFilters } = useFilters();

  const toggleBoolean = (key: BooleanFilterKey) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (prev[key]) {
        delete newFilters[key]; // remove filter if unchecked
      } else {
        newFilters[key] = true;
      }
      return newFilters;
    });
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Attributes
      </Typography>

      <FilterRarityGroup options={options.filter_rarity ?? []} />
      <FilterResourceGroup options={options.filter_resources ?? []} />
      <FilterDeedTypeGroup options={options.filter_deed_type ?? []} />
      <FilterPlotStatusGroup options={options.filter_plot_status ?? []} />

      <FormGroup sx={{ mt: 2 }}>
        {(
          [
            "filter_developed",
            "filter_under_construction",
            "filter_has_pp",
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
