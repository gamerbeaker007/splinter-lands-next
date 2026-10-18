"use client";

import DecPowerRow from "@/components/land-manager/production/dec-actions/DecPowerRow";
import { Stack } from "@mui/material";

interface Props {
  username: string;
  stakeActionable: number;
  unstakeActionable: number;
  busy: boolean;
  onStakeBusy: (busy: boolean) => void;
  onUnstakeBusy: (busy: boolean) => void;
  onSuccess: () => void;
  menuItem?: boolean;
  onMenuAction?: () => void;
}

export default function DecPowerControls({
  username,
  stakeActionable,
  unstakeActionable,
  busy,
  onStakeBusy,
  onUnstakeBusy,
  onSuccess,
  menuItem = false,
  onMenuAction,
}: Readonly<Props>) {
  const stakeRow = (
    <DecPowerRow
      username={username}
      direction="up"
      availableTotal={Math.ceil(stakeActionable)}
      anyBusy={busy}
      onBusyChange={onStakeBusy}
      onSuccess={onSuccess}
      menuItem={menuItem}
      onMenuAction={onMenuAction}
    />
  );
  const unstakeRow = (
    <DecPowerRow
      username={username}
      direction="down"
      availableTotal={Math.floor(unstakeActionable)}
      anyBusy={busy}
      onBusyChange={onUnstakeBusy}
      onSuccess={onSuccess}
      menuItem={menuItem}
      onMenuAction={onMenuAction}
    />
  );
  return menuItem ? (
    <>
      {stakeRow}
      {unstakeRow}
    </>
  ) : (
    <Stack direction={{ xs: "column", sm: "row" }} gap={1} alignItems="stretch">
      {stakeRow}
      {unstakeRow}
    </Stack>
  );
}
