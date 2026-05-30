"use client";

import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
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
            {allRegions.map((region) => (
              <FormControlLabel
                key={region.region_uid}
                control={
                  <Checkbox
                    checked={enabledRegions.includes(region.region_number)}
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
