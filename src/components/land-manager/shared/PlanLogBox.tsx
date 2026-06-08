"use client";

import { Paper } from "@mui/material";

interface Props {
  /** Plan/log lines to render, one per row. */
  lines: string[];
  /** Shown when `lines` is empty. */
  emptyText?: string;
  maxHeight?: number;
}

/** Monospace scroll box for displaying a planned-operations log (dry run, cover proposal, …). */
export default function PlanLogBox({
  lines,
  emptyText = "(nothing to do)",
  maxHeight = 400,
}: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        fontFamily: "monospace",
        fontSize: "0.75rem",
        whiteSpace: "pre-wrap",
        bgcolor: "action.hover",
        maxHeight,
        overflow: "auto",
      }}
    >
      {lines.join("\n") || emptyText}
    </Paper>
  );
}
