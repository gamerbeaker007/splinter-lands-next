import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { PlotModifiers, SlotInput } from "@/types/planner";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";
import { computeSlot } from "../../utils/calc";

type Props = {
  slots: SlotInput[];
  plotModifiers: PlotModifiers;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const sizeHammerIcon = 15;
const fontSize = 10;

export const PPOutput: React.FC<Props> = ({ slots, plotModifiers, pos }) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  // Sum all PP values
  const { totalBasePP, totalBoostedPP } = slots.reduce(
    (acc, slot) => {
      const { basePP, boostedPP } = computeSlot(slot, plotModifiers);
      acc.totalBasePP += basePP;
      acc.totalBoostedPP += boostedPP;
      return acc;
    },
    { totalBasePP: 0, totalBoostedPP: 0 },
  );

  return (
    <Box
      borderRadius={1}
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        p: 1,
        bgcolor: "rgba(0,0,0,0.6)",

        zIndex: 2,
      }}
    >
      <Box display="flex" flexDirection="column" mt={0.5} width="100%">
        {/* Base PP */}
        <Box display="flex" alignItems="center" gap={1} ml={0.5}>
          <Image
            src={land_hammer_icon_url}
            alt="production PP"
            width={sizeHammerIcon}
            height={sizeHammerIcon}
            style={{ display: "block" }}
          />
          <Box display="flex" justifyContent="space-between" flex={1}>
            <Typography fontSize={fontSize} color="common.white">
              Base PP:
            </Typography>
            <Typography
              fontSize={fontSize}
              fontWeight="bold"
              color="common.white"
            >
              {totalBasePP.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Typography>
          </Box>
        </Box>

        {/* Boosted PP */}
        <Box display="flex" alignItems="center" gap={1} ml={0.5} mt={0.5}>
          <Image
            src={land_hammer_icon_url}
            alt="production PP"
            width={sizeHammerIcon}
            height={sizeHammerIcon}
            style={{ display: "block" }}
          />
          <Box display="flex" justifyContent="space-between" flex={1}>
            <Typography fontSize={fontSize} color="common.white">
              Boosted PP:
            </Typography>
            <Typography
              fontSize={fontSize}
              fontWeight="bold"
              color="success.main"
            >
              {totalBoostedPP.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
