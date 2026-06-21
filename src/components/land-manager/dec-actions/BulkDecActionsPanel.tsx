"use client";

import DecPowerRow from "@/components/land-manager/dec-actions/DecPowerRow";
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
  const { globalShortfall, globalExcess } = useLandManagerRegionData(
    enabledRegions,
    refreshKey
  );

  // Drive the stake/unstake amount off the global DEC pool, not the sum of
  // per-region gaps: a region's staked DEC can read 0 while a building is in
  // progress even though that DEC is still staked overall, which would
  // over-state the amount. Stake rounds up, unstake rounds down.
  const stakeShortfall = Math.ceil(globalShortfall);
  const unstakeExcess = Math.floor(globalExcess);

  const [stakeBusy, setStakeBusy] = useState(false);
  const [unstakeBusy, setUnstakeBusy] = useState(false);

  const onStakeBusy = useCallback((b: boolean) => setStakeBusy(b), []);
  const onUnstakeBusy = useCallback((b: boolean) => setUnstakeBusy(b), []);

  if (enabledRegions.length === 0) return null;

  // Only one power op runs at a time — share the busy lock across both rows.
  const anyBusy = stakeBusy || unstakeBusy;
  const handleSuccess = onSuccess ?? (() => {});

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="column" gap={0.5} flexWrap="wrap" alignItems="left">
        <DecPowerRow
          username={username}
          enabledRegions={enabledRegions}
          direction="up"
          availableTotal={stakeShortfall}
          anyBusy={anyBusy}
          onBusyChange={onStakeBusy}
          onSuccess={handleSuccess}
        />
        <DecPowerRow
          username={username}
          enabledRegions={enabledRegions}
          direction="down"
          availableTotal={unstakeExcess}
          anyBusy={anyBusy}
          onBusyChange={onUnstakeBusy}
          onSuccess={handleSuccess}
        />
      </Stack>
    </Box>
  );
}
