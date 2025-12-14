import { Resource } from "@/constants/resource/resource";
import {
  bloodline_icon_url,
  dec_stake_discount_icon_url,
  energized_icon_url,
  labors_luck_icon_url,
  rationing_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { bountifulResourceIconMap } from "@/types/planner";
import { Box, capitalize, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

type Props = {
  resource: Resource;
  bloodlineBoost: number;
  decDiscount: number;
  grainConsumeReduction: number;
  productionBoost: number;
  replacePowerCore: boolean;
  laborLuck: boolean;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const iconSize = 25;
const fontSize = "0.7rem";
const fontColor = "common.white";

export const LandBoosts: React.FC<Props> = ({
  resource,
  bloodlineBoost,
  decDiscount,
  grainConsumeReduction,
  productionBoost,
  replacePowerCore,
  laborLuck,
  pos = { x: "0px", y: "0px", w: "auto" },
}) => {
  const { x, y, w } = pos;

  // Check if any boost exists
  const hasAnyBoost =
    (productionBoost && productionBoost > 0) ||
    (bloodlineBoost && bloodlineBoost > 0) ||
    (decDiscount && decDiscount > 0) ||
    (grainConsumeReduction && grainConsumeReduction > 0) ||
    replacePowerCore ||
    laborLuck;

  // Don't render if no boosts
  if (!hasAnyBoost) {
    return null;
  }

  const productionBoostPct = productionBoost
    ? Math.round(productionBoost * 100)
    : 0;

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
      <Box borderRadius={1} bgcolor="rgba(70, 71, 70, 0.9)" minHeight={110}>
        <Box
          display={"flex"}
          flexDirection={"row"}
          flexWrap={"wrap"}
          gap={1.5}
          p={1}
        >
          {productionBoost > 0 && (
            <Tooltip
              title={`Production Boost ${capitalize(resource.toLowerCase())} by ${productionBoostPct}%`}
            >
              <Box display={"flex"} flexDirection={"column"}>
                <Image
                  src={bountifulResourceIconMap[resource] ?? ""}
                  alt={resource}
                  width={iconSize}
                  height={iconSize}
                />
                <Typography fontSize={fontSize} color={fontColor}>
                  {productionBoostPct}%
                </Typography>
              </Box>
            </Tooltip>
          )}
          {bloodlineBoost > 0 && (
            <Tooltip
              title={`Bloodline Boost by ${Math.round(bloodlineBoost * 100)}%`}
            >
              <Box display={"flex"} flexDirection={"column"}>
                <Image
                  src={bloodline_icon_url}
                  alt="Bloodline"
                  width={iconSize}
                  height={iconSize}
                />
                <Typography fontSize={12}>
                  {Math.round(bloodlineBoost * 100)}%
                </Typography>
              </Box>
            </Tooltip>
          )}
          {decDiscount < 0 && (
            <Tooltip
              title={`DEC Stake Discount by ${Math.round(decDiscount * 100)}%`}
            >
              <Box display={"flex"} flexDirection={"column"}>
                <Image
                  src={dec_stake_discount_icon_url}
                  alt="DEC Discount"
                  width={iconSize}
                  height={iconSize}
                />
                <Typography fontSize={fontSize} color={fontColor}>
                  {Math.round(decDiscount * 100)}%
                </Typography>
              </Box>
            </Tooltip>
          )}
          {grainConsumeReduction < 0 && (
            <Tooltip
              title={`Grain Consumption Reduction by ${Math.round(grainConsumeReduction * 100)}%`}
            >
              <Box display={"flex"} flexDirection={"column"}>
                <Image
                  src={rationing_icon_url}
                  alt="Grain Reduction"
                  width={iconSize}
                  height={iconSize}
                />
                <Typography fontSize={fontSize} color={fontColor}>
                  {Math.round(grainConsumeReduction * 100)}%
                </Typography>
              </Box>
            </Tooltip>
          )}
          {replacePowerCore && (
            <Tooltip title="Replaces Power Core">
              <Box display={"flex"} flexDirection={"column"}>
                <Image
                  src={energized_icon_url}
                  alt="Power Core"
                  width={iconSize}
                  height={iconSize}
                />
                <Typography fontSize={fontSize} color={fontColor}></Typography>
              </Box>
            </Tooltip>
          )}
          {laborLuck && (
            <Tooltip title="Labor's Luck">
              <Box display={"flex"} flexDirection={"column"}>
                <Image
                  src={labors_luck_icon_url}
                  alt="Labor's Luck"
                  width={iconSize}
                  height={iconSize}
                />
                <Typography fontSize={fontSize} color={fontColor}></Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  );
};
