"use client";

import {
  saveLandManagerConfig,
  saveMakeHarvestableStrategies,
} from "@/lib/backend/actions/land-manager/config-actions";
import {
  LandManagerConfig,
  MAKE_HARVESTABLE_STRATEGY_LABELS,
  MakeHarvestableStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
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
    const [regionsResult, strategiesResult] = await Promise.all([
      saveLandManagerConfig(enabledRegions),
      saveMakeHarvestableStrategies(strategies),
    ]);
    setSaving(false);
    const err = regionsResult.error ?? strategiesResult.error;
    if (!regionsResult.success || !strategiesResult.success) {
      setError(err ?? "Save failed");
      return;
    }
    onSaved({
      ...config,
      enabled_regions: enabledRegions,
      make_harvestable_strategies: strategies,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Land Manager Config</DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle2" gutterBottom>
          Select regions to include in Land Manager actions
        </Typography>
        {allRegions.length === 0 ? (
          <Typography color="text.secondary">
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
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Make Harvestable Strategy */}
        <Typography variant="subtitle2" gutterBottom>
          Make Harvestable — Strategy Order
        </Typography>
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
                    sx={{ color: enabled ? "text.primary" : "text.disabled" }}
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
