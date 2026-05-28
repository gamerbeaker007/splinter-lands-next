"use client";

import RentWorkersRow from "@/components/land-manager/bulk-operations/RentWorkersRow";
import StakeDecRow from "@/components/land-manager/bulk-operations/StakeDecRow";
import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import type { RentalAuthorityStatus } from "@/lib/backend/actions/land-manager/authority-actions";
import { RentalConfig } from "@/types/landManager";
import { Box, Stack } from "@mui/material";
import { useCallback, useMemo, useState } from "react";

interface Props {
  username: string;
  enabledRegions: number[];
  rental: RentalConfig;
  authorityStatus?: RentalAuthorityStatus | null;
  refreshKey?: number;
  onSuccess?: () => void;
}

export default function BulkRentalPanel({
  username,
  enabledRegions,
  rental,
  authorityStatus,
  refreshKey = 0,
  onSuccess,
}: Props) {
  const { stakedDEC, eligibility } = useLandManagerRegionData(
    enabledRegions,
    refreshKey
  );

  const stakeShortfall = useMemo(
    () =>
      stakedDEC.reduce(
        (s, a) => s + Math.max(0, a.dec_stake_needed - a.dec_stake_in_use),
        0
      ),
    [stakedDEC]
  );

  const [busyMap, setBusyMap] = useState({
    rentWorkers: false,
    stakeDec: false,
  });

  const anyBusy = useMemo(
    () => Object.values(busyMap).some(Boolean),
    [busyMap]
  );

  const onRentWorkersBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, rentWorkers: b })),
    []
  );
  const onStakeDecBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, stakeDec: b })),
    []
  );

  if (enabledRegions.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="column" gap={0.5} flexWrap="wrap" alignItems="left">
        <RentWorkersRow
          username={username}
          enabledRegions={enabledRegions}
          rental={rental}
          authorityStatus={authorityStatus}
          eligiblePlotCount={eligibility?.eligible.length ?? null}
          anyBusy={anyBusy}
          onBusyChange={onRentWorkersBusy}
          onSuccess={onSuccess ?? (() => {})}
        />

        <StakeDecRow
          username={username}
          enabledRegions={enabledRegions}
          shortfallTotal={stakeShortfall}
          anyBusy={anyBusy}
          onBusyChange={onStakeDecBusy}
          onSuccess={onSuccess ?? (() => {})}
        />
      </Stack>
    </Box>
  );
}
