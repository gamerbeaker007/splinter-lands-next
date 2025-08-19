import { formatLargeNumber } from "@/lib/formatters";
import { CSSSize } from "@/types/cssSize";
import { Box, Typography } from "@mui/material";
import React from "react";
import { FaAngleDoubleUp } from "react-icons/fa";

type Props = {
  totalBoost: number;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const TotalBoostInfo: React.FC<Props> = ({
  totalBoost,
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
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent={"left"}
        color="white"
        gap={1}
      >
        <FaAngleDoubleUp
          style={{
            color: "green",
            width: "25",
            height: "25",
            transform: "rotate(45deg)",
          }}
        />

        <Typography fontSize="1.0rem">
          Total Boost:{formatLargeNumber(Number((totalBoost * 100).toFixed(0)))}
          %
        </Typography>
      </Box>
    </Box>
  );
};
