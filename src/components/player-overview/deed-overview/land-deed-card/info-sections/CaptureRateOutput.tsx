import { CSSSize } from "@/types/cssSize";
import { Box, Tooltip, Typography } from "@mui/material";
import React from "react";
import { FaPercent } from "react-icons/fa";

type Props = {
  captureRate: number;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const fontSize = "0.85rem";
const iconSize = 20;
const fontColor = "common.white";

export const CaptureRateOutput: React.FC<Props> = ({ captureRate, pos }) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        p: 1,
        zIndex: 2,
      }}
    >
      <Tooltip
        title={
          <Typography fontSize={fontSize} color={fontColor}>
            Capture Rate:
          </Typography>
        }
      >
        <Box display="flex" flexDirection="row" minWidth="210px" gap={1}>
          <Box display="flex" alignItems="center">
            <FaPercent size={iconSize} color={"orange"} />
          </Box>
          <Box display="flex" justifyContent="space-between" flex={1}>
            <Typography fontSize={fontSize} fontWeight="bold" color={fontColor}>
              {(captureRate * 100).toLocaleString(undefined, {
                maximumFractionDigits: 3,
              })}
              %
            </Typography>
          </Box>
        </Box>
      </Tooltip>
    </Box>
  );
};
