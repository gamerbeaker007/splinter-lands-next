"use client";

import { Chip, ChipProps } from "@mui/material";

/** The small outlined chip the Today panel uses for counts and totals. */
export default function StatChip({
  label,
  color,
}: Pick<ChipProps, "label" | "color">) {
  return (
    <Chip
      label={label}
      color={color}
      size="small"
      variant="outlined"
      sx={{ fontSize: "0.7rem" }}
    />
  );
}
