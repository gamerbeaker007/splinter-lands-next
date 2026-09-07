"use client";

import StrategyOrderList from "@/components/land-manager/config/StrategyOrderList";
import {
  ALL_MAKE_HARVESTABLE_STRATEGIES,
  MAKE_HARVESTABLE_STRATEGY_LABELS,
  MakeHarvestableStrategy,
} from "@/types/landManager";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";

type LayoutMode = "accordion" | "flat";

interface Props {
  strategies: MakeHarvestableStrategy[];
  onToggle: (s: MakeHarvestableStrategy) => void;
  onMove: (s: MakeHarvestableStrategy, dir: -1 | 1) => void;
  layout?: LayoutMode;
}

export default function MakeHarvestableSection({
  strategies,
  onToggle,
  onMove,
  layout = "accordion",
}: Props) {
  const content = (
    <>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        mb={1}
      >
        The first enabled strategy is tried first for each region. <br />
        <strong>Pool</strong> withdraws liquidity that has past the 30-day lock
        period. It pays no trade-hub fee, so it is usually the cheapest option
        when you keep resource in the pools.
      </Typography>
      <StrategyOrderList
        all={ALL_MAKE_HARVESTABLE_STRATEGIES}
        strategies={strategies}
        labels={MAKE_HARVESTABLE_STRATEGY_LABELS}
        onToggle={onToggle}
        onMove={onMove}
      />
    </>
  );

  if (layout === "flat") {
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Make Harvestable - Strategy Order
        </Typography>
        {content}
      </Box>
    );
  }

  return (
    <Accordion defaultExpanded={false} disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">
          Make Harvestable — Strategy Order
        </Typography>
      </AccordionSummary>
      <AccordionDetails>{content}</AccordionDetails>
    </Accordion>
  );
}
