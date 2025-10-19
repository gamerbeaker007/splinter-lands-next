"use client";

import {
  Avatar,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import {
  land_region_icon_url,
  land_tract_icon_url,
} from "@/lib/shared/statics_icon_urls";

interface RegionTractSelectorProps {
  selectedRegion: number | "";
  selectedTract: number | "";
  onRegionChange: (region: number) => void;
  onTractChange: (tract: number) => void;
}
const iconSize = 40;

export default function RegionTractSelector({
  selectedRegion,
  selectedTract,
  onRegionChange,
  onTractChange,
}: RegionTractSelectorProps) {
  return (
    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
      <Box minWidth={150} display="flex" alignItems="center" gap={1}>
        <Avatar
          src={land_region_icon_url}
          alt="region"
          sx={{ width: iconSize, height: iconSize }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Select Region</InputLabel>
          <Select
            value={selectedRegion}
            label="Region"
            onChange={(e) => onRegionChange(e.target.value as number)}
          >
            {Array.from({ length: 150 }, (_, i) => i + 1).map((region) => (
              <MenuItem key={region} value={region}>
                {region}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box minWidth={150} display="flex" alignItems="center" gap={1}>
        <Avatar
          src={land_tract_icon_url}
          alt="tract"
          sx={{ width: iconSize, height: iconSize }}
        />

        <FormControl sx={{ minWidth: 150 }} disabled={!selectedRegion}>
          <InputLabel>Select Tract</InputLabel>
          <Select
            value={selectedTract}
            label="Tract"
            onChange={(e) => onTractChange(e.target.value as number)}
          >
            {Array.from({ length: 100 }, (_, i) => i + 1).map((tract) => (
              <MenuItem key={tract} value={tract}>
                {tract}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}
