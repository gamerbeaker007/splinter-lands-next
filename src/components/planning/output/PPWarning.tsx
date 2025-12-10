import { Box, Tooltip, Typography } from "@mui/material";
import React from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function PPWarning() {
  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
            Base PP Too High
          </Typography>
          <Typography variant="body2">
            Your current selection exceeds the maximum allowed base PP. SPL caps
            base PP at 100,000, so the values shown here are not be accurate.
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
