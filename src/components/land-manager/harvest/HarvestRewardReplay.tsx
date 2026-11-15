"use client";

import ReplayIcon from "@mui/icons-material/Replay";
import { IconButton, Tooltip } from "@mui/material";

export default function HarvestRewardReplay({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip title={label}>
      <IconButton size="small" aria-label={label} onClick={onClick}>
        <ReplayIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
