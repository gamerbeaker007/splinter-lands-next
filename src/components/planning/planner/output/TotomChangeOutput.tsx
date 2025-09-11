import { totem_fragment_common_icon_url } from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { WorksiteType } from "@/types/planner";
import { Box, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

type Props = {
  worksiteType: WorksiteType;
  basePP: number;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const fontSize = "1.0rem";
const iconSize = 25;

function calcTotemChancePerHour(
  worksiteType: WorksiteType,
  basePP: number,
): number {
  if (worksiteType === "KEEP" || worksiteType === "CASTLE") {
    let multiplier = 1;
    switch (worksiteType) {
      case "KEEP":
        multiplier = 3;
        break;
      case "CASTLE":
        multiplier = 10;
        break;
    }
    return (basePP / 1000) * 0.0007 * multiplier;
  }
  return 0; // not applicable for other types
}

export const TotemChanceOutput: React.FC<Props> = ({
  worksiteType,
  basePP,
  pos,
}) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};
  const totemChance = calcTotemChancePerHour(worksiteType, basePP);

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
            Totem Fragment change per hour
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
              {totemChance.toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}
              % /h
            </Typography>
          </Box>
        </Box>
      </Tooltip>
    </Box>
  );
};
