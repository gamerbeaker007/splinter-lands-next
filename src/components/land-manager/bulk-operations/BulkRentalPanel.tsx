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
  const { globalShortfall, eligibility } = useLandManagerRegionData(
    enabledRegions,
    refreshKey
  );

  // Drive the stake amount off the global DEC pool, not the sum of per-region
  // gaps: a region's staked DEC can read 0 while a building is in progress even
  // though that DEC is still staked overall, which would over-state the amount.
  const stakeShortfall = Math.ceil(globalShortfall);

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
