"use client";

import { NATURAL_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import {
  DEFAULT_POST_HARVEST_POOL_PCT,
  DEFAULT_POST_HARVEST_SELL_PCT,
  DEFAULT_POST_HARVEST_STRATEGY,
  POST_HARVEST_STRATEGY_LABELS,
  PostHarvestStrategy,
} from "@/types/landManager";
import { InfoOutlined } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

interface Props {
  strategy: PostHarvestStrategy;
  onStrategyChange: (s: PostHarvestStrategy) => void;
  excludedResources: string[];
  onExcludedChange: (resources: string[]) => void;
  sellPct: number;
  poolPct: number;
  onSellPctChange: (v: number) => void;
  onPoolPctChange: (v: number) => void;
}

export default function PostHarvestSection({
  strategy,
  onStrategyChange,
  excludedResources,
  onExcludedChange,
  sellPct,
  poolPct,
  onSellPctChange,
  onPoolPctChange,
}: Props) {
  const accumulatePct = Math.max(0, 100 - sellPct - poolPct);

  return (
    <Accordion defaultExpanded={false} disableGutters elevation={0}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2">
          Post-Harvest — Resource Strategy
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1}
        >
          What to do with natural resources ({NATURAL_RESOURCES.join(", ")})
          stored in region storage after harvesting. TAX is never included.
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            value={strategy}
            onChange={(e) =>
              onStrategyChange(e.target.value as PostHarvestStrategy)
            }
          >
            {(
              Object.entries(POST_HARVEST_STRATEGY_LABELS) as [
                PostHarvestStrategy,
                string,
              ][]
            ).map(([value, label]) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio size="small" />}
                label={<Typography variant="body2">{label}</Typography>}
                sx={{ mb: 0.5 }}
              />
            ))}
          </RadioGroup>
        </FormControl>

        {/* Sell & Pool percentage configuration */}
        {strategy === "sell_and_pool" && (
          <Box mt={2}>
            <Typography
              variant="caption"
              fontWeight="bold"
              display="block"
              mb={1}
            >
              Split configuration
            </Typography>

            <Stack gap={1.5}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  Sell for DEC: {sellPct}%
                </Typography>
                <Slider
                  value={sellPct}
                  onChange={(_e, v) => {
                    const val = v as number;
                    onSellPctChange(val);
                    if (val + poolPct > 100) onPoolPctChange(100 - val);
                  }}
                  min={0}
                  max={100}
                  step={5}
                  size="small"
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}%`}
                />
              </Box>

              <Box>
                <Typography variant="body2" gutterBottom>
                  Add to pool (DEC): {poolPct}%
                </Typography>
                <Slider
                  value={poolPct}
                  onChange={(_e, v) => {
                    const val = v as number;
                    onPoolPctChange(val);
                    if (sellPct + val > 100) onSellPctChange(100 - val);
                  }}
                  min={0}
                  max={100}
                  step={5}
                  size="small"
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}%`}
                />
              </Box>

              {accumulatePct > 0 && (
                <Typography variant="body2" color="text.secondary">
                  Accumulate (do nothing): {accumulatePct}%
                </Typography>
              )}

              <Stack direction="row" spacing={0.75} alignItems="flex-start">
                <InfoOutlined
                  sx={{ fontSize: 14, color: "text.secondary", mt: 0.3 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Pool operations use DEC from your wallet. When sell% ≥ pool%,
                  sell proceeds typically cover the pool side automatically. If
                  pool% exceeds sell%, ensure you hold enough DEC — amounts are
                  scaled down proportionally if your balance falls short.
                </Typography>
              </Stack>
            </Stack>
          </Box>
        )}

        {strategy !== "accumulate" && (
          <Box mt={2}>
            <Typography
              variant="caption"
              fontWeight="bold"
              display="block"
              mb={0.5}
            >
              Exclude resources from processing
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={1}
            >
              Checked resources will be kept in storage (accumulated) even when
              the strategy above is active.
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0}>
              {NATURAL_RESOURCES.map((r) => (
                <Tooltip key={r} title={r}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={excludedResources.includes(r)}
                        onChange={() =>
                          onExcludedChange(
                            excludedResources.includes(r)
                              ? excludedResources.filter((x) => x !== r)
                              : [...excludedResources, r]
                          )
                        }
                        size="small"
                      />
                    }
                    label={
                      <Box
                        component="img"
                        src={RESOURCE_ICON_MAP[r]}
                        alt={r}
                        sx={{ width: 18, height: 18 }}
                      />
                    }
                    sx={{ mr: 1 }}
                  />
                </Tooltip>
              ))}
            </Stack>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

// Re-export defaults so ConfigDialog doesn't need to import from landManager directly
export {
  DEFAULT_POST_HARVEST_POOL_PCT,
  DEFAULT_POST_HARVEST_SELL_PCT,
  DEFAULT_POST_HARVEST_STRATEGY,
};
