import { Box, Tooltip, Typography } from "@mui/material";
import React from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function TaxSimulationWarning() {
  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
            Simulation Include Taxes
          </Typography>
          <Typography variant="body2">
            Consumed resource are based on a flat fee Keep 1K and Castle 10K
            GRAIN. These are removed of the simulation
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
