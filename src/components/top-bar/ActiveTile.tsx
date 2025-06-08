"use client";

import { ActiveDto } from "@/types/active";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

const MAX_PLOTS = 150_000;

export default function ActiveTile() {
  const [activeLatest, setActiveLatest] = useState<ActiveDto | null>(null);

  useEffect(() => {
    fetch("/api/active/latest")
      .then((res) => res.json())
      .then(setActiveLatest)
      .catch(console.error);
  }, []);

  const percentage = (
    ((activeLatest?.activeBasedOnPp ?? 0) / MAX_PLOTS) *
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
