"use client";

import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  Typography,
} from "@mui/material";

interface Props {
  allRegions: SplProductionOverviewRegion[];
  enabledRegions: number[];
  onToggle: (regionNumber: number) => void;
}

export default function EnabledRegionsSection({
  allRegions,
  enabledRegions,
  onToggle,
}: Props) {
  const enabled = new Set(enabledRegions);
  const selectedCount = allRegions.filter((r) =>
    enabled.has(r.region_number)
  ).length;
  const allSelected =
    allRegions.length > 0 && selectedCount === allRegions.length;

  // Flip only the regions that are not already in the target state. onToggle is
  // a functional state update in the parent, so calling it per region is safe.
  const handleToggleAll = () => {
    allRegions.forEach((r) => {
      if (enabled.has(r.region_number) === allSelected) {
        onToggle(r.region_number);
      }
    });
  };

  return (
    <Accordion defaultExpanded={false} disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">Enabled Regions</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1}
        >
          Select regions to include in Land Manager actions.
        </Typography>
        {allRegions.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No regions found. Make sure you are logged in with a player that
            owns plots.
          </Typography>
        ) : (
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && !allSelected}
                  onChange={handleToggleAll}
                />
              }
              label={
                <Typography variant="body2" fontWeight="bold">
                  {allSelected ? "Deselect all" : "Select all"}
                  <Typography
                    variant="caption"
                    component="span"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    {selectedCount} of {allRegions.length} selected
                  </Typography>
                </Typography>
              }
              sx={{ display: "flex", mb: 0.5 }}
            />
            <Divider sx={{ mb: 1 }} />
            {allRegions.map((region) => (
              <FormControlLabel
                key={region.region_uid}
                control={
                  <Checkbox
                    checked={enabled.has(region.region_number)}
                    onChange={() => onToggle(region.region_number)}
                  />
                }
                label={
                  <Box>
                    <Typography
                      variant="body2"
                      component="span"
                      fontWeight="bold"
                    >
                      {region.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      component="span"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      Region #{region.region_number} · {region.plots_owned}{" "}
                      plots
                    </Typography>
                  </Box>
                }
                sx={{ display: "flex", mb: 0.5 }}
              />
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
