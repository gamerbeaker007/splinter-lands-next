"use client";

import {
  MAKE_HARVESTABLE_STRATEGY_LABELS,
  MakeHarvestableStrategy,
} from "@/types/landManager";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

const ALL_STRATEGIES: MakeHarvestableStrategy[] = [
  "transfer",
  "swap",
  "buy_dec",
];

interface Props {
  strategies: MakeHarvestableStrategy[];
  onToggle: (s: MakeHarvestableStrategy) => void;
  onMove: (s: MakeHarvestableStrategy, dir: -1 | 1) => void;
}

export default function MakeHarvestableSection({
  strategies,
  onToggle,
  onMove,
}: Props) {
  return (
    <Accordion defaultExpanded={false} disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">
          Make Harvestable — Strategy Order
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1}
        >
          The first enabled strategy is tried first for each region.
        </Typography>
        {[
          ...strategies,
          ...ALL_STRATEGIES.filter((s) => !strategies.includes(s)),
        ].map((s) => {
          const enabled = strategies.includes(s);
          return (
            <Stack
              key={s}
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{ mb: 0.5 }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={enabled}
                    onChange={() => onToggle(s)}
                    size="small"
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    sx={{
                      color: enabled ? "text.primary" : "text.disabled",
                    }}
                  >
                    {MAKE_HARVESTABLE_STRATEGY_LABELS[s]}
                  </Typography>
                }
                sx={{ flex: 1, m: 0 }}
              />
              {enabled && (
                <>
                  <Tooltip title="Move up (higher priority)">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onMove(s, -1)}
                        disabled={strategies.indexOf(s) === 0}
                      >
                        <KeyboardArrowUp fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Move down (lower priority)">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onMove(s, 1)}
                        disabled={
                          strategies.indexOf(s) === strategies.length - 1
                        }
                      >
                        <KeyboardArrowDown fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
            </Stack>
          );
        })}
      </AccordionDetails>
    </Accordion>
  );
}
