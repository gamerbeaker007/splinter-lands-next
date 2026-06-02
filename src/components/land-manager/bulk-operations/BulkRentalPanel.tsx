"use client";

import RentWorkersRow from "@/components/land-manager/bulk-operations/RentWorkersRow";
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
  const { eligibility } = useLandManagerRegionData(enabledRegions, refreshKey);

  const [busyMap, setBusyMap] = useState({
    rentWorkers: false,
  });

  const anyBusy = useMemo(
    () => Object.values(busyMap).some(Boolean),
    [busyMap]
  );

  const onRentWorkersBusy = useCallback(
    (b: boolean) => setBusyMap((m) => ({ ...m, rentWorkers: b })),
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
      </Stack>
    </Box>
  );
}
