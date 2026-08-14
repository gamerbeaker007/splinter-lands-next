"use client";

import {
  saveBuyConfig,
  saveDonationConfig,
  saveLandManagerConfig,
  saveMakeHarvestableStrategies,
  savePostHarvestExcludedResources,
  savePostHarvestStrategy,
  saveRentalConfig,
  saveTopUpPoolStrategies,
} from "@/lib/backend/actions/land-manager/config-actions";
import {
  BuyConfig,
  DEFAULT_POST_HARVEST_POOL_PCT,
  DEFAULT_POST_HARVEST_SELL_PCT,
  DEFAULT_POST_HARVEST_STRATEGY,
  DonationConfig,
  LandManagerConfig,
  MakeHarvestableStrategy,
  PostHarvestStrategy,
  RentalConfig,
  TopUpPoolStrategy,
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
import BuyEmptyWorkersSection from "./BuyEmptyWorkersSection";
import DonationSettingsSection from "./DonationSettingsSection";
import EnabledRegionsSection from "./EnabledRegionsSection";
import MakeHarvestableSection from "./MakeHarvestableSection";
import PostHarvestSection from "./PostHarvestSection";
import RentEmptyWorkersSection from "./RentEmptyWorkersSection";
import TopUpPoolSection from "./TopUpPoolSection";

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
  const [topUpStrategies, setTopUpStrategies] = useState<TopUpPoolStrategy[]>(
    config.top_up_pool_strategies
  );
  const [rental, setRental] = useState<RentalConfig>(config.rental);
  const [buy, setBuy] = useState<BuyConfig>(config.buy);
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
    setTopUpStrategies(config.top_up_pool_strategies);
    setRental(config.rental);
    setBuy(config.buy);
    setError(null);
    onClose();
  };

  /** Add/remove a strategy from an ordered preferred/fallback list. */
  function toggleIn<T extends string>(
    setter: (fn: (prev: T[]) => T[]) => void
  ): (s: T) => void {
    return (s) =>
      setter((prev) =>
        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
      );
  }

  /** Swap a strategy with its neighbour, changing its priority. */
  function moveIn<T extends string>(
    current: T[],
    setter: (next: T[]) => void
  ): (s: T, dir: -1 | 1) => void {
    return (s, dir) => {
      const idx = current.indexOf(s);
      const target = idx + dir;
      if (idx === -1 || target < 0 || target >= current.length) return;
      const next = [...current];
      [next[idx], next[target]] = [next[target], next[idx]];
      setter(next);
    };
  }

  const toggleStrategy = toggleIn<MakeHarvestableStrategy>(setStrategies);
  const moveStrategy = moveIn(strategies, setStrategies);
  const toggleTopUpStrategy = toggleIn<TopUpPoolStrategy>(setTopUpStrategies);
  const moveTopUpStrategy = moveIn(topUpStrategies, setTopUpStrategies);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const [
      regionsResult,
      strategiesResult,
      donationResult,
      postHarvestResult,
      excludedResult,
      topUpResult,
      rentalResult,
      buyResult,
    ] = await Promise.all([
      saveLandManagerConfig(enabledRegions),
      saveMakeHarvestableStrategies(strategies),
      saveDonationConfig(donation),
      savePostHarvestStrategy(postHarvestStrategy, sellPct, poolPct),
      savePostHarvestExcludedResources(excludedResources),
      saveTopUpPoolStrategies(topUpStrategies),
      saveRentalConfig(rental),
      saveBuyConfig(buy),
    ]);
    setSaving(false);
    const results = [
      regionsResult,
      strategiesResult,
      donationResult,
      postHarvestResult,
      excludedResult,
      topUpResult,
      rentalResult,
      buyResult,
    ];
    const failed = results.find((r) => !r.success);
    if (failed) {
      setError(failed.error ?? "Save failed");
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
      top_up_pool_strategies: topUpStrategies,
      rental,
      buy,
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

        <TopUpPoolSection
          strategies={topUpStrategies}
          onToggle={toggleTopUpStrategy}
          onMove={moveTopUpStrategy}
        />

        <RentEmptyWorkersSection rental={rental} onChange={setRental} />

        <BuyEmptyWorkersSection buy={buy} onChange={setBuy} />

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
