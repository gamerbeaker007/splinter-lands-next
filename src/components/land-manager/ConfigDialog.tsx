"use client";

import {
  saveLandManagerConfig,
  saveMakeHarvestableStrategies,
  savePostHarvestExcludedResources,
  savePostHarvestStrategy,
} from "@/lib/backend/actions/land-manager/config-actions";
import { NATURAL_RESOURCES } from "@/lib/shared/statics";
import {
  DEFAULT_POST_HARVEST_STRATEGY,
  LandManagerConfig,
  MAKE_HARVESTABLE_STRATEGY_LABELS,
  MakeHarvestableStrategy,
  POST_HARVEST_STRATEGY_LABELS,
  PostHarvestStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  config: LandManagerConfig;
  allRegions: SplProductionOverviewRegion[];
  onSaved: (updated: LandManagerConfig) => void;
}

export default function ConfigDialog({
  open,
  onClose,
  config,
  allRegions,
  onSaved,
}: Props) {
  const [enabledRegions, setEnabledRegions] = useState<number[]>(
    config.enabled_regions
  );
  const [strategies, setStrategies] = useState<MakeHarvestableStrategy[]>(
    config.make_harvestable_strategies
  );
  const [postHarvestStrategy, setPostHarvestStrategy] =
    useState<PostHarvestStrategy>(
      config.post_harvest_strategy ?? DEFAULT_POST_HARVEST_STRATEGY
    );
  const [excludedResources, setExcludedResources] = useState<string[]>(
    config.post_harvest_excluded_resources ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = (regionNumber: number) => {
    setEnabledRegions((prev) =>
      prev.includes(regionNumber)
        ? prev.filter((r) => r !== regionNumber)
        : [...prev, regionNumber]
    );
  };

  const ALL_STRATEGIES: MakeHarvestableStrategy[] = [
    "transfer",
    "swap",
    "buy_dec",
  ];

  const toggleStrategy = (s: MakeHarvestableStrategy) => {
    setStrategies((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const moveStrategy = (s: MakeHarvestableStrategy, dir: -1 | 1) => {
    const idx = strategies.indexOf(s);
    if (idx === -1) return;
    const next = [...strategies];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setStrategies(next);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const [regionsResult, strategiesResult, postHarvestResult, excludedResult] =
      await Promise.all([
        saveLandManagerConfig(enabledRegions),
        saveMakeHarvestableStrategies(strategies),
        savePostHarvestStrategy(postHarvestStrategy),
        savePostHarvestExcludedResources(excludedResources),
      ]);
    setSaving(false);
    const err =
      regionsResult.error ??
      strategiesResult.error ??
      postHarvestResult.error ??
      excludedResult.error;
    if (
      !regionsResult.success ||
      !strategiesResult.success ||
      !postHarvestResult.success ||
      !excludedResult.success
    ) {
      setError(err ?? "Save failed");
      return;
    }
    onSaved({
      ...config,
      enabled_regions: enabledRegions,
      make_harvestable_strategies: strategies,
      post_harvest_strategy: postHarvestStrategy,
      post_harvest_excluded_resources: excludedResources,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Land Manager Config</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {/* ── Regions ───────────────────────────────────────── */}
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
                        onChange={() => handleToggle(region.region_number)}
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

        {/* ── Make Harvestable Strategy ─────────────────────── */}
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
                        onChange={() => toggleStrategy(s)}
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
                            onClick={() => moveStrategy(s, -1)}
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
                            onClick={() => moveStrategy(s, 1)}
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

        {/* ── Post-Harvest Strategy ─────────────────────────── */}
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
              What to do with natural resources (${NATURAL_RESOURCES.join(", ")}
              ) stored in region storage after harvesting. TAX is never
              included.
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={postHarvestStrategy}
                onChange={(e) =>
                  setPostHarvestStrategy(e.target.value as PostHarvestStrategy)
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

            {postHarvestStrategy !== "accumulate" && (
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
                  Checked resources will be kept in storage (accumulated) even
                  when the strategy above is active.
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={0}>
                  {NATURAL_RESOURCES.map((r) => (
                    <FormControlLabel
                      key={r}
                      control={
                        <Checkbox
                          checked={excludedResources.includes(r)}
                          onChange={() =>
                            setExcludedResources((prev) =>
                              prev.includes(r)
                                ? prev.filter((x) => x !== r)
                                : [...prev, r]
                            )
                          }
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">{r}</Typography>}
                      sx={{ mr: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {error && (
          <Typography color="error" variant="body2" sx={{ px: 2, pb: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
