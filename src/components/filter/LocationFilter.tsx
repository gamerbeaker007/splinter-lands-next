"use client";

import { useFilters } from "@/lib/frontend/context/FilterContext";
import { FilterInput } from "@/types/filters";
import { Box, Typography } from "@mui/material";
import MultiSelect from "../ui/multiselect/MultiSelect";

type Props = {
  options: FilterInput;
  showRegion: boolean;
  showTract: boolean;
  showPlot: boolean;
};

export default function LocationFilter({
  options,
  showRegion = true,
  showTract = true,
  showPlot = true,
}: Props) {
  const { filters, setFilters } = useFilters();

  const update = (field: keyof FilterInput, values: number[]) => {
    setFilters((prev) => ({ ...prev, [field]: values }));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Location
      </Typography>
      {showRegion && (
        <MultiSelect
          label="Regions"
          values={options.filter_regions ?? []}
          selected={filters?.filter_regions ?? []}
          onChange={(vals) => update("filter_regions", vals)}
        />
      )}
      {showTract && (
        <MultiSelect
          label="Tracts"
          values={options.filter_tracts ?? []}
          selected={filters?.filter_tracts ?? []}
          onChange={(vals) => update("filter_tracts", vals)}
        />
      )}
      {showPlot && (
        <MultiSelect
          label="Plots"
          values={options.filter_plots ?? []}
          selected={filters?.filter_plots ?? []}
          onChange={(vals) => update("filter_plots", vals)}
        />
      )}
    </Box>
  );
}
