"use client";

import FilterIcon from "@/components/filter/FilterIcon";
import MultiSelect from "@/components/ui/multiselect/MultiSelect";
import {
  land_default_off_icon_url_placeholder,
  land_mythic_icon_url,
  WEB_URL,
} from "@/lib/shared/statics_icon_urls";
import {
  DeedType,
  deedTypeOptions,
  PlotRarity,
  plotRarityOptions,
  PlotStatus,
  plotStatusOptions,
  worksiteIconMap,
  WorksiteType,
  worksiteTypeOptions,
} from "@/types/planner";
import { DeedFilterOptions, PlaygroundDeed } from "@/types/playground";
import InfoIcon from "@mui/icons-material/Info";
import {
  Box,
  Checkbox,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
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

  const handleRarityToggle = (rarity: PlotRarity) => {
    const updated = filterOptions.rarities.includes(rarity)
      ? filterOptions.rarities.filter((r) => r !== rarity)
      : [...filterOptions.rarities, rarity];
    onFilterChange({ ...filterOptions, rarities: updated });
  };

  const handleStatusToggle = (status: PlotStatus) => {
    const updated = filterOptions.statuses.includes(status)
      ? filterOptions.statuses.filter((s) => s !== status)
      : [...filterOptions.statuses, status];
    onFilterChange({ ...filterOptions, statuses: updated });
  };

  const handleTerrainToggle = (terrain: DeedType) => {
    const updated = filterOptions.terrains.includes(terrain)
      ? filterOptions.terrains.filter((t) => t !== terrain)
      : [...filterOptions.terrains, terrain];
    onFilterChange({ ...filterOptions, terrains: updated });
  };

  const handleWorksiteToggle = (worksite: WorksiteType) => {
    const updated = filterOptions.worksites.includes(worksite)
      ? filterOptions.worksites.filter((w) => w !== worksite)
      : [...filterOptions.worksites, worksite];
    onFilterChange({ ...filterOptions, worksites: updated });
  };

  const getDeedTypeIcon = (deedType: string) => {
    const deed_type_icon_url = `${WEB_URL}website/ui_elements/lands/sideMenu/__NAME__Off.svg`;
    return deed_type_icon_url.replace("__NAME__", deedType.toLowerCase());
  };

  const getIcon = (type: PlotStatus) => {
    return type == "mythic"
      ? land_mythic_icon_url
      : land_default_off_icon_url_placeholder.replace(
          "__NAME__",
          type.toLowerCase()
        );
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Typography variant="h6">Deed Filters</Typography>
        <Tooltip title="Filters apply to initially loaded deeds only">
          <InfoIcon fontSize="small" color="action" />
        </Tooltip>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Location Filters */}
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

        {/* Land Rarity Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Land Rarity:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {plotRarityOptions.map((rarity) => (
              <FilterIcon
                key={rarity}
                name={rarity}
                isActive={filterOptions.rarities.includes(rarity)}
                image={getIcon(rarity)}
                onChange={() => handleRarityToggle(rarity)}
              />
            ))}
          </Box>
        </Box>

        {/* Status Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Status:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {plotStatusOptions.map((status) => (
              <FilterIcon
                key={status}
                name={status}
                isActive={filterOptions.statuses.includes(status)}
                image={getIcon(status)}
                onChange={() => handleStatusToggle(status)}
              />
            ))}
          </Box>
        </Box>

        {/* Terrain/Geography Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Geography:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {deedTypeOptions.map((terrain) => (
              <FilterIcon
                key={terrain}
                name={terrain}
                isActive={filterOptions.terrains.includes(terrain)}
                image={getDeedTypeIcon(terrain)}
                onChange={() => handleTerrainToggle(terrain)}
              />
            ))}
          </Box>
        </Box>

        {/* Worksite Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Worksite:
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {worksiteTypeOptions.map((worksite) => (
              <FilterIcon
                key={worksite}
                name={worksite}
                isActive={filterOptions.worksites.includes(worksite)}
                image={worksiteIconMap[worksite]}
                onChange={() => handleWorksiteToggle(worksite)}
              />
            ))}
          </Box>
        </Box>

        {/* Under Construction Filter */}
        <Box display={"flex"} flexDirection={"row"} gap={2}>
          <Box>
            <Typography variant="body2" gutterBottom>
              Under Construction Only
            </Typography>
            <Checkbox
              checked={filterOptions.underConstruction}
              onChange={() =>
                onFilterChange({
                  ...filterOptions,
                  underConstruction: !filterOptions.underConstruction,
                })
              }
              size="small"
            />
          </Box>

          {/* Undeveloped Filter */}
          <Box>
            <Typography variant="body2" gutterBottom>
              Undeveloped Only
            </Typography>
            <Checkbox
              checked={filterOptions.developed}
              onChange={() =>
                onFilterChange({
                  ...filterOptions,
                  developed: !filterOptions.developed,
                })
              }
              size="small"
            />
          </Box>
        </Box>

        {/* Max Workers Filter */}
        <Box>
          <Typography variant="body2" gutterBottom>
            Max Workers
          </Typography>
          <TextField
            type="number"
            size="small"
            value={filterOptions.maxWorkers ?? ""}
            onChange={(e) => {
              const value =
                e.target.value === "" ? null : Number(e.target.value);
              onFilterChange({
                ...filterOptions,
                maxWorkers: value,
              });
            }}
            placeholder="No limit"
            inputProps={{ min: 0, max: 5 }}
            sx={{ width: 120 }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
