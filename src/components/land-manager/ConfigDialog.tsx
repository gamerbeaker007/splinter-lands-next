"use client";

import {
  saveDonationConfig,
  saveLandManagerConfig,
  saveMakeHarvestableStrategies,
  savePostHarvestExcludedResources,
  savePostHarvestStrategy,
  saveRentalConfig,
} from "@/lib/backend/actions/land-manager/config-actions";
import { MIN_RESOURCE_DONATION_AMOUNT } from "@/lib/frontend/donationPayment";
import { NATURAL_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { FOIL_IDS, foilLabel } from "@/lib/utils/cardUtil";
import {
  DEFAULT_DONATION_DAILY_CAPS,
  DEFAULT_POST_HARVEST_POOL_PCT,
  DEFAULT_POST_HARVEST_SELL_PCT,
  DEFAULT_POST_HARVEST_STRATEGY,
  DonationConfig,
  LandManagerConfig,
  MAKE_HARVESTABLE_STRATEGY_LABELS,
  MakeHarvestableStrategy,
  POST_HARVEST_STRATEGY_LABELS,
  PostHarvestStrategy,
  RENTAL_STRATEGY_LABELS,
  RentalConfig,
  RentalStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import {
  InfoOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
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
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
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
  const [donation, setDonation] = useState<DonationConfig>(config.donation);
  const [postHarvestStrategy, setPostHarvestStrategy] =
    useState<PostHarvestStrategy>(
      config.post_harvest_strategy ?? DEFAULT_POST_HARVEST_STRATEGY
    );
  const [excludedResources, setExcludedResources] = useState<string[]>(
    config.post_harvest_excluded_resources ?? []
  );
  const [sellPct, setSellPct] = useState<number>(
    config.post_harvest_sell_pct ?? DEFAULT_POST_HARVEST_SELL_PCT
  );
  const [poolPct, setPoolPct] = useState<number>(
    config.post_harvest_pool_pct ?? DEFAULT_POST_HARVEST_POOL_PCT
  );
  const [rental, setRental] = useState<RentalConfig>(config.rental);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const accumulatePct = Math.max(0, 100 - sellPct - poolPct);

  // Reset edits to the last-saved config and close. Wired to both the Cancel
  // button and the Dialog's backdrop/escape close so a misclick discards the
  // in-progress edits instead of leaving stale values for next open.
  const handleClose = () => {
    setEnabledRegions(config.enabled_regions);
    setStrategies(config.make_harvestable_strategies);
    setDonation(config.donation);
    setPostHarvestStrategy(
      config.post_harvest_strategy ?? DEFAULT_POST_HARVEST_STRATEGY
    );
    setExcludedResources(config.post_harvest_excluded_resources ?? []);
    setSellPct(config.post_harvest_sell_pct ?? DEFAULT_POST_HARVEST_SELL_PCT);
    setPoolPct(config.post_harvest_pool_pct ?? DEFAULT_POST_HARVEST_POOL_PCT);
    setRental(config.rental);
    setError(null);
    onClose();
  };

  const setRentalNumber = (key: keyof RentalConfig, value: string) => {
    const parsed = Number(value);
    setRental((prev) => ({
      ...prev,
      [key]: Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0,
    }));
  };

  const MIN_DAILY_CAP = 100;

  const setDonationCap = (symbol: string, value: string) => {
    const parsed = Number(value);
    setDonation((prev) => ({
      ...prev,
      daily_caps: {
        ...prev.daily_caps,
        [symbol]:
          Number.isFinite(parsed) && parsed >= MIN_DAILY_CAP
            ? Math.floor(parsed)
            : MIN_DAILY_CAP,
      },
    }));
  };

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
    const [
      regionsResult,
      strategiesResult,
      donationResult,
      postHarvestResult,
      excludedResult,
      rentalResult,
    ] = await Promise.all([
      saveLandManagerConfig(enabledRegions),
      saveMakeHarvestableStrategies(strategies),
      saveDonationConfig(donation),
      savePostHarvestStrategy(postHarvestStrategy, sellPct, poolPct),
      savePostHarvestExcludedResources(excludedResources),
      saveRentalConfig(rental),
    ]);
    setSaving(false);
    const err =
      regionsResult.error ??
      strategiesResult.error ??
      donationResult.error ??
      postHarvestResult.error ??
      excludedResult.error ??
      rentalResult.error;
    if (
      !regionsResult.success ||
      !strategiesResult.success ||
      !donationResult.success ||
      !postHarvestResult.success ||
      !excludedResult.success ||
      !rentalResult.success
    ) {
      setError(err ?? "Save failed");
      return;
    }
    onSaved({
      ...config,
      enabled_regions: enabledRegions,
      make_harvestable_strategies: strategies,
      donation,
      post_harvest_strategy: postHarvestStrategy,
      post_harvest_excluded_resources: excludedResources,
      post_harvest_sell_pct: sellPct,
      post_harvest_pool_pct: poolPct,
      rental,
    });
    onClose();
    // Refresh server components so derived panels (RegionOverview, AlertsPanel,
    // RentalOverview, etc.) re-fetch with the new enabled regions / rental
    // config.
    router.refresh();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Land Manager Config</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {/* -- Regions ------------------------------------------------- */}
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

        {/* -- Make Harvestable Strategy -------------------------------- */}
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

        {/* -- Donation Settings -------------------------------------- */}
        <Accordion defaultExpanded={false} disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Donation Settings</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={1}
            >
              Configure optional donation transfers after harvest. Set daily
              caps per resource. Use 0 to disable a cap for that resource.
            </Typography>

            <Stack gap={1.5}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={donation.enabled}
                    onChange={(e) =>
                      setDonation((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                  />
                }
                label={
                  <Typography variant="body2">Enable donations</Typography>
                }
              />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems="flex-start"
              >
                <Box sx={{ width: { xs: "100%", sm: "42%" } }}>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    display="block"
                    mb={1}
                  >
                    Percentage
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Donation %"
                    value={donation.pct}
                    onChange={(e) => {
                      const parsed = Number(e.target.value);
                      const next = Number.isFinite(parsed)
                        ? Math.max(0, Math.min(100, Math.floor(parsed)))
                        : 0;
                      setDonation((prev) => ({ ...prev, pct: next }));
                    }}
                    slotProps={{ htmlInput: { min: 0, max: 100 } }}
                    helperText="Current default is 2%."
                  />
                </Box>

                <Box sx={{ width: { xs: "100%", sm: "58%" } }}>
                  <Typography
                    variant="caption"
                    fontWeight="bold"
                    display="block"
                    mb={1}
                  >
                    Daily caps
                  </Typography>
                  <Stack spacing={1}>
                    {Object.keys(DEFAULT_DONATION_DAILY_CAPS).map((symbol) => (
                      <Stack
                        key={symbol}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <Tooltip title={symbol}>
                          <Box
                            component="img"
                            src={RESOURCE_ICON_MAP[symbol]}
                            alt={symbol}
                            sx={{ width: 22, height: 22, flexShrink: 0 }}
                          />
                        </Tooltip>
                        <TextField
                          size="small"
                          type="number"
                          value={donation.daily_caps[symbol] ?? MIN_DAILY_CAP}
                          onChange={(e) =>
                            setDonationCap(symbol, e.target.value)
                          }
                          slotProps={{ htmlInput: { min: MIN_DAILY_CAP } }}
                          helperText={`Min ${MIN_DAILY_CAP}`}
                          sx={{ flex: 1 }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    mt={1}
                  >
                    Minimum daily cap: {MIN_DAILY_CAP}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Minimum per transaction:{MIN_RESOURCE_DONATION_AMOUNT},
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Donations below these thresholds are skipped as not worth
                    the transaction cost.
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* -- Post-Harvest Strategy ----------------------------------- */}
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

            {/* Sell & Pool percentage configuration */}
            {postHarvestStrategy === "sell_and_pool" && (
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
                        setSellPct(val);
                        if (val + poolPct > 100) setPoolPct(100 - val);
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
                        setPoolPct(val);
                        if (sellPct + val > 100) setSellPct(100 - val);
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
                      Pool operations use DEC from your wallet. When sell% ≥
                      pool%, sell proceeds typically cover the pool side
                      automatically. If pool% exceeds sell%, ensure you hold
                      enough DEC — amounts are scaled down proportionally if
                      your balance falls short.
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            )}

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
                    <Tooltip key={r} title={r}>
                      <FormControlLabel
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

        {/* -- Rent Empty Workers -------------------------------------- */}
        <Accordion defaultExpanded={false} disableGutters elevation={0}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              Rent Empty Workers — Settings
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              mb={1}
            >
              Strategy and spending caps for renting cards into empty worker
              slots on powered plots. Use 0 to disable a cap.
            </Typography>

            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" mb={0.5}>
                Strategy
              </Typography>
              <RadioGroup
                value={rental.strategy}
                onChange={(e) =>
                  setRental((prev) => ({
                    ...prev,
                    strategy: e.target.value as RentalStrategy,
                  }))
                }
              >
                {(
                  Object.entries(RENTAL_STRATEGY_LABELS) as [
                    RentalStrategy,
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

            <Stack gap={1.5}>
              <TextField
                size="small"
                type="number"
                label="Max total DEC (whole run)"
                value={rental.max_total_dec}
                onChange={(e) =>
                  setRentalNumber("max_total_dec", e.target.value)
                }
                slotProps={{ htmlInput: { min: 0 } }}
                helperText="0 = no limit. Total DEC you'll spend on this run — factors in rental_days × DEC/day for every pick."
              />
              <TextField
                size="small"
                type="number"
                label="Max DEC/day per worker"
                value={rental.max_dec_per_day_per_worker}
                onChange={(e) =>
                  setRentalNumber("max_dec_per_day_per_worker", e.target.value)
                }
                slotProps={{ htmlInput: { min: 0 } }}
                helperText="0 = no limit. Max daily rental rate per single card. Card types whose cheapest listing exceeds this are skipped before fetch."
              />
              <TextField
                size="small"
                type="number"
                label="Min land_base_pp per card"
                value={rental.min_land_base_pp}
                onChange={(e) =>
                  setRentalNumber("min_land_base_pp", e.target.value)
                }
                slotProps={{ htmlInput: { min: 0 } }}
                helperText="0 = no minimum. Skip cards whose land_base_pp is below this."
              />
              <FormControl size="small">
                <InputLabel id="rental-min-foil-label">Minimum foil</InputLabel>
                <Select
                  labelId="rental-min-foil-label"
                  label="Minimum foil"
                  value={rental.min_foil}
                  onChange={(e) =>
                    setRental((prev) => ({
                      ...prev,
                      min_foil: Number(e.target.value),
                    }))
                  }
                >
                  {FOIL_IDS.map((f) => (
                    <MenuItem key={f} value={f}>
                      {foilLabel(f)}
                    </MenuItem>
                  ))}
                </Select>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  Skip cards whose foil rank is below this. Regular = include
                  all.
                </Typography>
              </FormControl>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {error && (
          <Typography color="error" variant="body2" sx={{ px: 2, pb: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
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
