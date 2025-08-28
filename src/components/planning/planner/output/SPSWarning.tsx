import { Box, Tooltip, Typography } from "@mui/material";
import React from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function SPSWarning() {
  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
            SPS shown is an estimate
          </Typography>
          <Typography variant="body2">
            We estimate hourly SPS using the network‑wide average ratio across
            SPS plots:
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: "monospace" }}
            mt={0.25}
          >
            ratio = rewards_per_hour / (boostedPP × site_efficiency)
          </Typography>
          <Typography variant="body2" mt={0.75}>
            Actual rewards can differ due to pool fluctuations, rounding,
            timing, and changes in other players’ production. Treat this value
            as an approximation.
          </Typography>
        </Box>
      }
      placement="right"
      arrow
    >
      <WarningAmberIcon
        fontSize="small"
        sx={{
          color: "warning.main",
          verticalAlign: "middle",
          cursor: "help",
        }}
      />
    </Tooltip>
  );
}
