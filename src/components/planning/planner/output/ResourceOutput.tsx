import { calcConsumeCosts } from "@/lib/shared/costCalc";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { CSSSize } from "@/types/cssSize";
import { PlotModifiers, resourceWorksiteMap, SlotInput } from "@/types/planner";
import { Prices } from "@/types/price";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";
import { computeSlot } from "../../utils/calc";

type Props = {
  slots: SlotInput[];
  plotModifiers: PlotModifiers;
  prices: Prices;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const ResourceOutput: React.FC<Props> = ({
  slots,
  plotModifiers,
  prices,
  pos,
}) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  // Sum all PP values
  const { totalBasePP } = slots.reduce(
    (acc, slot) => {
      const { basePP, boostedPP } = computeSlot(slot, plotModifiers);
      acc.totalBasePP += basePP;
      acc.totalBoostedPP += boostedPP;
      return acc;
    },
    { totalBasePP: 0, totalBoostedPP: 0 },
  );

  const resource = resourceWorksiteMap[plotModifiers.worksiteType];
  const consume = calcConsumeCosts(resource, totalBasePP, prices, 1);

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
        <Box>
          <Typography fontSize="0.75rem" fontWeight="bold" mb={0.5}>
            Consumes:
          </Typography>
          {consume &&
            consume.map((row, idx) => {
              const icon = RESOURCE_ICON_MAP[row.resource];
              return (
                <Box
                  key={idx}
                  display="flex"
                  alignItems="center"
                  gap={0.5}
                  mb={0.25}
                >
                  {icon && (
                    <Image
                      src={icon}
                      alt={row.resource}
                      width={20}
                      height={20}
                    />
                  )}
                  <Typography fontSize="0.75rem">
                    {row.amount.toFixed(1)} /h
                  </Typography>
                </Box>
              );
            })}
        </Box>
      </Box>
    </Box>
  );
};
