"use client";

import { Chip, Typography } from "@mui/material";

interface Props {
  /** The harvest/claim date. Accepts ISO string, Date object, null, or undefined. */
  date: string | Date | null | undefined;
  /**
   * Label to show when no date is available.
   * @default "—"
   */
  emptyLabel?: string;
}

/**
 * Shows a coloured chip indicating how long ago a harvest/claim occurred,
 * relative to Splinterlands' 7-day resource-loss cap:
 *   <5 d   → green  (safe)
 *   5–7 d → yellow  (approaching cap)
 *   > 7 d → red     (past safe window)
 */
export default function LastHarvestAgeChip({
  date,
  emptyLabel = "—",
}: Props) {
  if (!date) {
    return (
      <Typography variant="caption" color="text.secondary">
        {emptyLabel}
      </Typography>
    );
  }

  const now = new Date().getTime();
  const diffDays = (now - new Date(date).getTime()) / 86_400_000;
  const wholeDays = Math.floor(diffDays);
  const hours = Math.floor((diffDays - wholeDays) * 24);
  const label =
    diffDays < 1
      ? `${hours}h`
      : hours > 0
        ? `${wholeDays}d ${hours}h`
        : `${wholeDays}d`;
  const color: "success" | "warning" | "error" =
      diffDays >= 7
        ? "error"
        : diffDays >= 5
          ? "warning"
          : "success";

  return (
    <Chip
      label={label}
      size="small"
      color={color}
      variant="outlined"
      sx={{ fontSize: "0.65rem" }}
    />
  );
}
