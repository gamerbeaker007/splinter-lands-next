"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getLatestActiveEntry } from "@/lib/backend/api/internal/active-data";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

const MAX_PLOTS = 150_000;

export default function ActiveTile() {
  const { data: activeLatest } = useAsyncData("latest-active", () =>
    getLatestActiveEntry()
  );

  const percentage = (
    ((activeLatest?.active_based_on_pp ?? 0) / MAX_PLOTS) *
    100
  ).toFixed(1);

  return (
    <Tooltip title="Percentage of active land based on PP" arrow>
      <Box
        sx={{
          width: 65,
          height: 22,
          bgcolor: "secondary.main",
          color: "secondary.contrastText",
          borderRadius: "999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: 1,
          cursor: "default",
        }}
      >
        <Typography variant="caption">{percentage}%</Typography>
      </Box>
    </Tooltip>
  );
}
