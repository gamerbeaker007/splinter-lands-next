"use client";

import DryRunDialog from "@/components/land-manager/harvest/DryRunDialog";
import HarvestAllRow from "@/components/land-manager/harvest/HarvestAllRow";
import HarvestMythicsRow from "@/components/land-manager/harvest/HarvestMythicsRow";
import MakeHarvestableRow from "@/components/land-manager/harvest/MakeHarvestableRow";
import ProcessResourcesRow from "@/components/land-manager/harvest/ProcessResourcesRow";
import {
  DonationConfig,
  DryRunResult,
  MakeHarvestableStrategy,
  PostHarvestStrategy,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { Box, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

interface Props {
  username: string;
  regions: SplProductionOverviewRegion[];
  enabledRegions: number[];
  strategies: MakeHarvestableStrategy[];
  donation: DonationConfig;
  postHarvestStrategy: PostHarvestStrategy;
  postHarvestExcludedResources: string[];
  postHarvestSellPct: number;
  postHarvestPoolPct: number;
  hasMythics: boolean;
  onSuccess?: () => void;
}

export default function BulkActionPanel({
  username,
  regions,
  enabledRegions,
  strategies,
  donation,
  postHarvestStrategy,
  postHarvestExcludedResources,
  postHarvestSellPct,
  postHarvestPoolPct,
  hasMythics,
  onSuccess,
}: Props) {
  const router = useRouter();
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [busyMap, setBusyMap] = useState({
    harvest: false,
    makeHarvestable: false,
    processResources: false,
    mythicHarvest: false,
  });

  const visibleRegions = regions.filter((r) =>
    enabledRegions.includes(r.region_number)
  );

  const afterSuccess = useCallback(() => {
    router.refresh();
    onSuccess?.();
  }, [router, onSuccess]);

  const onHarvestBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, harvest: b })),
    []
  );
  const onMakeHarvestableBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, makeHarvestable: b })),
    []
  );
  const onMythicHarvestBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, mythicHarvest: b })),
    []
  );
  const onProcessResourcesBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, processResources: b })),
    []
  );

  const anyBusy = useMemo(
    () => Object.values(busyMap).some(Boolean),
    [busyMap]
  );

  if (visibleRegions.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="column" gap={0.5} flexWrap="wrap" alignItems="left">
        <HarvestAllRow
          username={username}
          visibleRegions={visibleRegions}
          donation={donation}
          anyBusy={anyBusy}
          onBusyChange={onHarvestBusy}
          onDryRun={setDryRun}
          onSuccess={afterSuccess}
        />

        <MakeHarvestableRow
          username={username}
          visibleRegions={visibleRegions}
          strategies={strategies}
          anyBusy={anyBusy}
          onBusyChange={onMakeHarvestableBusy}
          onDryRun={setDryRun}
          onSuccess={afterSuccess}
        />

        <HarvestMythicsRow
          username={username}
          visibleRegions={visibleRegions}
          donation={donation}
          hasMythics={hasMythics}
          anyBusy={anyBusy}
          onBusyChange={onMythicHarvestBusy}
          onDryRun={setDryRun}
          onSuccess={afterSuccess}
        />

        <ProcessResourcesRow
          username={username}
          visibleRegions={visibleRegions}
          postHarvestStrategy={postHarvestStrategy}
          postHarvestExcludedResources={postHarvestExcludedResources}
          sellPct={postHarvestSellPct}
          poolPct={postHarvestPoolPct}
          anyBusy={anyBusy}
          onBusyChange={onProcessResourcesBusy}
          onDryRun={setDryRun}
          onSuccess={afterSuccess}
        />
      </Stack>

      {dryRun && (
        <DryRunDialog result={dryRun} onClose={() => setDryRun(null)} />
      )}
    </Box>
  );
}
