"use client";

import MultiSelect from "@/components/ui/multiselect/MultiSelect";
import { DeedFilterOptions, PlaygroundDeed } from "@/types/playground";
import { Box, Paper, Typography } from "@mui/material";
import { useMemo } from "react";

type PlaygroundFilterProps = {
  deeds: PlaygroundDeed[];
  filterOptions: DeedFilterOptions;
  onFilterChange: (newFilters: DeedFilterOptions) => void;
};

export default function PlaygroundFilter({
  deeds,
  filterOptions,
  onFilterChange,
}: PlaygroundFilterProps) {
  // Get unique values from deeds
  const availableRegions = useMemo(() => {
    const regions = [...new Set(deeds.map((d) => d.region_number))];
    return regions.sort((a, b) => a - b);
  }, [deeds]);

  const availableTracts = useMemo(() => {
    const tracts = [...new Set(deeds.map((d) => d.tract_number))];
    return tracts.sort((a, b) => a - b);
  }, [deeds]);

  const availablePlots = useMemo(() => {
    const plots = [...new Set(deeds.map((d) => d.plot_number))];
    return plots.sort((a, b) => a - b);
  }, [deeds]);

  const handleRegionChange = (selected: number[]) => {
    onFilterChange({
      ...filterOptions,
      regions: selected,
    });
  };

  const handleTractChange = (selected: number[]) => {
    onFilterChange({
      ...filterOptions,
      tracts: selected,
    });
  };

  const handlePlotChange = (selected: number[]) => {
    onFilterChange({
      ...filterOptions,
      plots: selected,
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ minWidth: 200 }}>
          <MultiSelect
            label="Regions"
            values={availableRegions}
            selected={filterOptions.regions}
            onChange={handleRegionChange}
          />
        </Box>

        <Box sx={{ minWidth: 200 }}>
          <MultiSelect
            label="Tracts"
            values={availableTracts}
            selected={filterOptions.tracts}
            onChange={handleTractChange}
          />
        </Box>

        <Box sx={{ minWidth: 200 }}>
          <MultiSelect
            label="Plots"
            values={availablePlots}
            selected={filterOptions.plots}
            onChange={handlePlotChange}
          />
        </Box>
      </Box>
    </Paper>
  );
}
