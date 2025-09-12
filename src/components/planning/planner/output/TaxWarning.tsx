import { Box, Tooltip, Typography } from "@mui/material";
import React from "react";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function TaxWarning() {
  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
            Taxes are shown per hour, based on region and tract data from daily
            history.
          </Typography>
          <Typography variant="body2">
            Please note: These values are estimates. Actual taxes may vary
            depending on player activity, such as harvesting or changing plots
            in real time.
          </Typography>
          <Typography variant="body2" mt={0.75}>
            Also, in the Net DEC output, consumed resources are not included, as
            they are charged as a flat fee rather than an hourly rate.
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
