import React from "react";
import { Tooltip, IconButton, Box, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import {
  getDateDisplayText,
  hasMultipleEntries,
  getDateTooltipContent,
} from "@/lib/utils/dateColumnUtils";

interface DateColumnProps {
  record: Record<string, Date> | undefined;
  type: "lastUsed" | "stakeEnd" | "survivalDate";
}

export const DateColumn: React.FC<DateColumnProps> = ({ record, type }) => {
  const displayText = getDateDisplayText(record, type);
  const showInfoIcon = hasMultipleEntries(record, type);
  const tooltipContent = getDateTooltipContent(record, type);

  if (displayText === "-") {
    return (
      <Typography variant="body2" color="text.secondary">
        -
      </Typography>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={0.5}>
      <Typography variant="body2">{displayText}</Typography>
      {showInfoIcon && tooltipContent && (
        <Tooltip
          title={
            <Box
              component="pre"
              sx={{ whiteSpace: "pre-line", fontSize: "0.75rem" }}
            >
              {tooltipContent}
            </Box>
          }
          placement="top"
          arrow
        >
          <IconButton size="small" sx={{ padding: 0.25 }}>
            <InfoIcon fontSize="small" color="action" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default DateColumn;
