"use client";

import DryRunDialog from "@/components/land-manager/bulk-operations/DryRunDialog";
import HarvestAllRow from "@/components/land-manager/bulk-operations/HarvestAllRow";
import HarvestMythicsRow from "@/components/land-manager/bulk-operations/HarvestMythicsRow";
import MakeHarvestableRow from "@/components/land-manager/bulk-operations/MakeHarvestableRow";
import ProcessResourcesRow from "@/components/land-manager/bulk-operations/ProcessResourcesRow";
import RentEmptyWorkersRow from "@/components/land-manager/bulk-operations/RentEmptyWorkersRow";
import StakeDecRow from "@/components/land-manager/bulk-operations/StakeDecRow";
import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import { getFeeApplicableRegionNumbers } from "@/lib/backend/actions/land-manager/fee-actions";
import {
  DryRunResult,
  MakeHarvestableStrategy,
  PostHarvestStrategy,
  RentalConfig,
} from "@/types/landManager";
import { SplProductionOverviewRegion } from "@/types/spl/landManager";
import { Box, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Props {
  username: string;
  regions: SplProductionOverviewRegion[];
  enabledRegions: number[];
  strategies: MakeHarvestableStrategy[];
  harvestAck: boolean;
  postHarvestStrategy: PostHarvestStrategy;
  postHarvestExcludedResources: string[];
  mythicFeeAccepted: boolean;
  hasMythics: boolean;
  rental: RentalConfig;
  refreshKey?: number;
  onSuccess?: () => void;
}

export default function BulkActionPanel({
  username,
  regions,
  enabledRegions,
  strategies,
  harvestAck,
  postHarvestStrategy,
  postHarvestExcludedResources,
  mythicFeeAccepted,
  hasMythics,
  rental,
  refreshKey = 0,
  onSuccess,
}: Props) {
  const router = useRouter();
  const { alerts } = useLandManagerRegionData(enabledRegions, refreshKey);
  const stakeShortfall = useMemo(
    () =>
      alerts.reduce(
        (s, a) => s + Math.max(0, a.dec_stake_needed - a.dec_stake_in_use),
        0
      ),
    [alerts]
  );
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [feeApplicableRegionNumbers, setFeeApplicableRegionNumbers] = useState<
    Set<number>
  >(new Set());
  const [busyMap, setBusyMap] = useState({
    harvest: false,
    makeHarvestable: false,
    processResources: false,
    mythicHarvest: false,
    rentEmptyWorkers: false,
    stakeDec: false,
  });

  useEffect(() => {
    if (!username) return;
    const regionNumbers = regions.map((r) => r.region_number);
    getFeeApplicableRegionNumbers(username, regionNumbers).then((nums) =>
      setFeeApplicableRegionNumbers(new Set(nums))
    );
  }, [username, regions]);

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
  const onRentEmptyWorkersBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, rentEmptyWorkers: b })),
    []
  );
  const onStakeDecBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, stakeDec: b })),
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
          harvestAck={harvestAck}
          anyBusy={anyBusy}
          feeApplicableRegionNumbers={feeApplicableRegionNumbers}
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
          mythicFeeAccepted={mythicFeeAccepted}
          hasMythics={hasMythics}
          anyBusy={anyBusy}
          feeApplicableRegionNumbers={feeApplicableRegionNumbers}
          onBusyChange={onMythicHarvestBusy}
          onDryRun={setDryRun}
          onSuccess={afterSuccess}
        />

        <ProcessResourcesRow
          username={username}
          visibleRegions={visibleRegions}
          postHarvestStrategy={postHarvestStrategy}
          postHarvestExcludedResources={postHarvestExcludedResources}
          anyBusy={anyBusy}
          onBusyChange={onProcessResourcesBusy}
          onDryRun={setDryRun}
          onSuccess={afterSuccess}
        />

        <RentEmptyWorkersRow
          username={username}
          enabledRegions={enabledRegions}
          rental={rental}
          anyBusy={anyBusy}
          onBusyChange={onRentEmptyWorkersBusy}
          onSuccess={afterSuccess}
        />

        <StakeDecRow
          username={username}
          enabledRegions={enabledRegions}
          shortfallTotal={stakeShortfall}
          anyBusy={anyBusy}
          onBusyChange={onStakeDecBusy}
          onSuccess={afterSuccess}
        />
      </Stack>

      {dryRun && (
        <DryRunDialog result={dryRun} onClose={() => setDryRun(null)} />
      )}
    </Box>
  );
}
