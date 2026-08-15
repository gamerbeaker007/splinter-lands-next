"use client";

import StrategyOrderList from "@/components/land-manager/config/StrategyOrderList";
import {
  ALL_TOP_UP_POOL_STRATEGIES,
  TOP_UP_POOL_STRATEGY_LABELS,
  TopUpPoolStrategy,
} from "@/types/landManager";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Typography,
} from "@mui/material";

interface Props {
  strategies: TopUpPoolStrategy[];
  onToggle: (s: TopUpPoolStrategy) => void;
  onMove: (s: TopUpPoolStrategy, dir: -1 | 1) => void;
}

export default function TopUpPoolSection({
  strategies,
  onToggle,
  onMove,
}: Props) {
  return (
    <Accordion defaultExpanded={false} disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">
          Top Up Pools — Strategy Order
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1}
        >
          Adds roughly one week of consumption back into the liquidity pools so
          it matures past the 30-day lock and can later be withdrawn tax-free by
          Make Harvestable. The first enabled strategy must be able to fund the
          whole target for a resource; only then is the next one tried.
          Unchecked strategies are never used. Clearing every strategy disables
          the action and its pool-buffer warning. &quot;Swap surplus of another
          resource&quot; only ever spends what a resource holds above its own
          weekly target plus one week of its own consumption, so covering a
          grain shortage with spare wood cannot starve the wood top-up.
        </Typography>
        <StrategyOrderList
          all={ALL_TOP_UP_POOL_STRATEGIES}
          strategies={strategies}
          labels={TOP_UP_POOL_STRATEGY_LABELS}
          onToggle={onToggle}
          onMove={onMove}
        />
        <Alert severity="info" sx={{ mt: 1 }}>
          <Typography variant="caption">
            Run this once per week, preferably on about the same day. Running it
            more often adds more resource to the pools; running it less often
            shrinks the tax-free buffer available to Make Harvestable.
          </Typography>
        </Alert>
      </AccordionDetails>
    </Accordion>
  );
}
