"use client";

import WorkersRow from "@/components/land-manager/rental/WorkersRow";
import type { AuthorityCoreStatus } from "@/hooks/useAuthorityStatusCore";
import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import { BuyConfig, RentalConfig } from "@/types/landManager";
import { Box, Stack } from "@mui/material";
import { useCallback, useMemo, useState } from "react";

interface Props {
  username: string;
  enabledRegions: number[];
  rental: RentalConfig;
  buy: BuyConfig;
  rentalAuthorityStatus?: AuthorityCoreStatus | null;
  purchaseAuthorityStatus?: AuthorityCoreStatus | null;
  refreshKey?: number;
  onSuccess?: () => void;
}

export default function BulkRentalPanel({
  username,
  enabledRegions,
  rental,
  buy,
  rentalAuthorityStatus,
  purchaseAuthorityStatus,
  refreshKey = 0,
  onSuccess,
}: Readonly<Props>) {
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
        <WorkersRow
          username={username}
          enabledRegions={enabledRegions}
          rental={rental}
          buy={buy}
          rentalAuthorityStatus={rentalAuthorityStatus}
          purchaseAuthorityStatus={purchaseAuthorityStatus}
          eligiblePlotCount={eligibility?.eligible.length ?? null}
          anyBusy={anyBusy}
          onBusyChange={onRentWorkersBusy}
          onSuccess={onSuccess ?? (() => {})}
        />
      </Stack>
    </Box>
  );
}
