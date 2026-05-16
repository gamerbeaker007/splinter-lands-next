"use client";

import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";

export function SectionLabel({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="subtitle2">{label}</Typography>
      <Tooltip title={tooltip}>
        <IconButton size="small">
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
