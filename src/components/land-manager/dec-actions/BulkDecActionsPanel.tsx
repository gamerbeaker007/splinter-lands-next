"use client";

import StakeDecRow from "@/components/land-manager/dec-actions/StakeDecRow";
import { useLandManagerRegionData } from "@/hooks/useLandManagerRegionData";
import { Box, Stack } from "@mui/material";
import { useCallback, useState } from "react";

interface Props {
  username: string;
  enabledRegions: number[];
  refreshKey?: number;
  onSuccess?: () => void;
}

export default function BulkDecActionsPanel({
  username,
  enabledRegions,
  refreshKey = 0,
  onSuccess,
}: Props) {
  const { globalShortfall } = useLandManagerRegionData(
    enabledRegions,
    refreshKey
  );

  // Drive the stake amount off the global DEC pool, not the sum of per-region
  // gaps: a region's staked DEC can read 0 while a building is in progress even
  // though that DEC is still staked overall, which would over-state the amount.
  const stakeShortfall = Math.ceil(globalShortfall);

  const [stakeDecBusy, setStakeDecBusy] = useState(false);

  const onStakeDecBusy = useCallback((b: boolean) => setStakeDecBusy(b), []);

  if (enabledRegions.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="column" gap={0.5} flexWrap="wrap" alignItems="left">
        <StakeDecRow
          username={username}
          enabledRegions={enabledRegions}
          shortfallTotal={stakeShortfall}
          anyBusy={stakeDecBusy}
          onBusyChange={onStakeDecBusy}
          onSuccess={onSuccess ?? (() => {})}
        />
      </Stack>
    </Box>
  );
}
