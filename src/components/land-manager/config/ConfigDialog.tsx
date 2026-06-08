"use client";

import {
  saveDonationConfig,
  saveLandManagerConfig,
  saveMakeHarvestableStrategies,
  savePostHarvestExcludedResources,
  savePostHarvestStrategy,
  saveRentalConfig,
} from "@/lib/backend/actions/land-manager/config-actions";
import {
  DEFAULT_POST_HARVEST_POOL_PCT,
  DEFAULT_POST_HARVEST_SELL_PCT,
  DEFAULT_POST_HARVEST_STRATEGY,
  DonationConfig,
  LandManagerConfig,
  MakeHarvestableStrategy,
  PostHarvestStrategy,
  RentalConfig,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DonationSettingsSection from "./DonationSettingsSection";
import EnabledRegionsSection from "./EnabledRegionsSection";
import MakeHarvestableSection from "./MakeHarvestableSection";
import PostHarvestSection from "./PostHarvestSection";
import RentEmptyWorkersSection from "./RentEmptyWorkersSection";

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
        <EnabledRegionsSection
          allRegions={allRegions}
          enabledRegions={enabledRegions}
          onToggle={(n) =>
            setEnabledRegions((prev) =>
              prev.includes(n) ? prev.filter((r) => r !== n) : [...prev, n]
            )
          }
        />

        <MakeHarvestableSection
          strategies={strategies}
          onToggle={toggleStrategy}
          onMove={moveStrategy}
        />

        <DonationSettingsSection donation={donation} onChange={setDonation} />

        <PostHarvestSection
          strategy={postHarvestStrategy}
          onStrategyChange={setPostHarvestStrategy}
          excludedResources={excludedResources}
          onExcludedChange={setExcludedResources}
          sellPct={sellPct}
          poolPct={poolPct}
          onSellPctChange={setSellPct}
          onPoolPctChange={setPoolPct}
        />

        <RentEmptyWorkersSection rental={rental} onChange={setRental} />

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
