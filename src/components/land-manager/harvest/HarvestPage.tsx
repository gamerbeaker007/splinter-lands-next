"use client";

import BulkActionPanel from "@/components/land-manager/harvest/BulkActionPanel";
import MythicOverview from "@/components/land-manager/harvest/MythicOverview";
import RegionOverview from "@/components/land-manager/harvest/RegionOverview";
import { useLandManagerContext } from "@/lib/frontend/context/LandManagerContext";
import { getPlayerMythicDeeds } from "@/lib/backend/actions/land-manager/overview-actions";
import { NATURAL_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { MythicDeed } from "@/types/landManager";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";

export default function HarvestPage() {
  const { auth, config, allRegions, refreshKey, triggerRefresh } =
    useLandManagerContext();

  const [allMythicDeeds, setAllMythicDeeds] = useState<MythicDeed[] | null>(
    null
  );

  useEffect(() => {
    getPlayerMythicDeeds().then(setAllMythicDeeds);
  }, [refreshKey]);

  const enabledMythicDeeds =
    allMythicDeeds?.filter((d) =>
      config.enabled_regions.includes(d.region_number)
    ) ?? null;

  const donation = config.donation;
  const donationEnabled = donation.enabled && donation.pct > 0;
  const username = auth.username ?? "";

  return (
    <>
      <Stack direction="row" alignItems="center" mb={1.5}>
        {donationEnabled ? (
          <Tooltip
            title={
              <Stack spacing={1} sx={{ py: 0.5 }}>
                <Typography variant="body2" fontWeight={700}>
                  Donation {donation.pct}%
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                  Daily caps
                </Typography>
                <Stack spacing={0.5}>
                  {NATURAL_RESOURCES.map((symbol) => {
                    const cap = Number(donation.daily_caps?.[symbol] ?? 0);
                    return (
                      <Stack
                        key={symbol}
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                      >
                        <Box
                          component="img"
                          src={RESOURCE_ICON_MAP[symbol]}
                          alt={symbol}
                          sx={{ width: 16, height: 16 }}
                        />
                        <Typography variant="caption">
                          {cap.toLocaleString()}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Donation applies to all harvest operations and can be adjusted
                  in the config.
                </Typography>
              </Stack>
            }
          >
            <Chip
              size="small"
              label="Donation Enabled"
              sx={{
                fontWeight: 600,
                bgcolor: "success.main",
                color: "common.white",
              }}
            />
          </Tooltip>
        ) : (
          <Chip
            size="small"
            label="Donation Disabled"
            sx={{
              fontWeight: 600,
              bgcolor: "warning.main",
              color: "common.white",
            }}
          />
        )}
      </Stack>

      <BulkActionPanel
        username={username}
        regions={allRegions}
        enabledRegions={config.enabled_regions}
        strategies={config.make_harvestable_strategies}
        donation={config.donation}
        postHarvestStrategy={config.post_harvest_strategy}
        postHarvestExcludedResources={config.post_harvest_excluded_resources}
        postHarvestSellPct={config.post_harvest_sell_pct}
        postHarvestPoolPct={config.post_harvest_pool_pct}
        topUpPoolStrategies={config.top_up_pool_strategies}
        hasMythics={
          enabledMythicDeeds !== null && enabledMythicDeeds.length > 0
        }
        onSuccess={triggerRefresh}
      />

      <MythicOverview deeds={enabledMythicDeeds} />

      <RegionOverview
        username={username}
        regions={allRegions}
        enabledRegions={config.enabled_regions}
        donation={config.donation}
        refreshKey={refreshKey}
      />
    </>
  );
}
