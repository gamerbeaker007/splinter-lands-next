import { CSSSize } from "@/types/cssSize";
import { Box, Tooltip } from "@mui/material";
import React from "react";
import { ProgressBar } from "../progress/ProgressBar";

type Props = {
  resourceIcon: string;
  percentage: number;
  toolTip: string;
  label: string;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const StoreInfo: React.FC<Props> = ({
  resourceIcon,
  percentage,
  toolTip,
  label,
  pos = { x: "0px", y: "0px", w: "auto" },
}) => {
  const { x, y, w } = pos;

  return (
    <Box
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: "left",
      }}
    >
      <Tooltip title={toolTip}>
        <Box width={275}>
          <ProgressBar
            percentage={percentage}
            label={label}
            icon={resourceIcon}
          />
        </Box>
      </Tooltip>
    </Box>
  );
};
