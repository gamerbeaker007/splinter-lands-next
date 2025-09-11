import { totem_fragment_common_icon_url } from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { Box, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

type Props = {
  estimateChange: number;
  perHour?: boolean;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const fontSize = "0.85rem";
const iconSize = 25;

export const TotemChanceOutput: React.FC<Props> = ({
  estimateChange,
  perHour,
  pos,
}) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  const suffix = perHour ? "\h" : "";

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
          <Typography fontSize={fontSize} color="common.white">
            Totem Fragment change
          </Typography>
        }
      >
        <Box display="flex" flexDirection="row" minWidth="210px" gap={1}>
          <Box display="flex" alignItems="center">
            <Image
              src={totem_fragment_common_icon_url}
              alt="Totem fragment"
              width={iconSize}
              height={iconSize}
              style={{ display: "block" }}
            />
          </Box>
          <Box display="flex" justifyContent="space-between" flex={1}>
            <Typography
              fontSize={fontSize}
              fontWeight="bold"
              color="common.white"
            >
              {(estimateChange * 100).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
              % {suffix}
            </Typography>
          </Box>
        </Box>
      </Tooltip>
    </Box>
  );
};
