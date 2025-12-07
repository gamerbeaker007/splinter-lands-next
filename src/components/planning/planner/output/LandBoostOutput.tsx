import {
  determineBloodlineBoost,
  determineGrainConsumeReduction,
  determineProductionBoost,
} from "@/lib/frontend/utils/plannerCalcs";
import {
  bloodline_icon_url,
  dec_stake_discount_icon_url,
  energized_icon_url,
  labors_luck_icon_url,
  rationing_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import {
  bountifulResourceIconMap,
  PlotPlannerData,
  resourceWorksiteMap,
} from "@/types/planner";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

type Props = {
  plotPlannerData: PlotPlannerData;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const sizeIcon = 30;
const fontSize = "0.8rem";
const fontColor = "common.white";

function formatPercentage(value: number) {
  return `${Math.round(value * 100)}%`;
}

export const LandBoostOutput: React.FC<Props> = ({ plotPlannerData, pos }) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};
  const { cardInput, worksiteType } = plotPlannerData;

  // Calculate DEC Discount
  const totalDecDiscount = cardInput.reduce((sum, card) => {
    return sum + (card.landBoosts?.decDiscount || 0);
  }, 0);

  // Calculate Production Boosts (only for matching worksite resources)
  const resource = resourceWorksiteMap[worksiteType];
  const productionBoosts = determineProductionBoost(resource, cardInput);

  const totalGrainDiscount = determineGrainConsumeReduction(cardInput);

  // Check for Replace Power Core
  const hasReplacePowerCore = cardInput.some(
    (card) => card.landBoosts?.replacePowerCore
  );

  // Count Labor Luck
  const laborLuckCount = cardInput.filter(
    (card) => card.landBoosts?.laborLuck
  ).length;

  // Calculate total bloodline boost including details
  const { totalBloodlineBoost, bloodlineBoostDetails } =
    determineBloodlineBoost(cardInput);

  return (
    <Box
      borderRadius={1}
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        bgcolor: "rgba(0,0,0,0.4)",
        p: 1,
        minHeight: "110px",
      }}
    >
      <Stack spacing={1}>
        <Typography fontSize="1.0rem" fontWeight="bold" color={fontColor}>
          Land Boosts:
        </Typography>
        {/* DEC Discount */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {totalDecDiscount > 0 && (
            <Tooltip title="Dark Discount" placement="top">
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Image
                  src={dec_stake_discount_icon_url}
                  alt="DEC"
                  width={sizeIcon}
                  height={sizeIcon}
                />
                <Typography fontSize={fontSize} color={fontColor}>
                  -{formatPercentage(totalDecDiscount)}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Production Boosts */}
          {productionBoosts > 0 && (
            <Tooltip
              key={resource}
              placement="top"
              title={`Bountiful ${resource.charAt(0).toUpperCase() + resource.slice(1).toLowerCase()}`}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Image
                  src={bountifulResourceIconMap[resource] ?? ""}
                  alt={resource}
                  width={sizeIcon}
                  height={sizeIcon}
                />
                <Typography fontSize={fontSize} color={fontColor}>
                  +{formatPercentage(productionBoosts)}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Consumption Discounts */}
          <Stack spacing={0.5}>
            {totalGrainDiscount > 0 && (
              <Tooltip title="Rationing" placement="top">
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Image
                    src={rationing_icon_url}
                    alt={"GRAIN"}
                    width={sizeIcon}
                    height={sizeIcon}
                  />
                  <Typography fontSize={fontSize} color={fontColor}>
                    -{formatPercentage(totalGrainDiscount)}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Stack>

          {/* Replace Power Core */}
          {hasReplacePowerCore && (
            <Tooltip title="Energized" placement="top">
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Image
                  src={energized_icon_url}
                  alt={"Power Core"}
                  width={sizeIcon}
                  height={sizeIcon}
                />
                <Typography fontSize={fontSize} color={fontColor}>
                  -1
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Labor Luck */}
          {laborLuckCount > 0 && (
            <Tooltip title="Labor's Luck" placement="top">
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Image
                  src={labors_luck_icon_url}
                  alt={"Labor's Luck"}
                  width={sizeIcon}
                  height={sizeIcon}
                />{" "}
                <Typography fontSize={fontSize} color={fontColor}>
                  {laborLuckCount}
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Stack>

        {/* Bloodline Boosts - Toil and Kin */}
        {totalBloodlineBoost > 0 && (
          <Tooltip
            title={
              <Box>
                <Typography fontSize={fontSize} fontWeight="bold" mb={0.5}>
                  Toil and Kin
                </Typography>
                {bloodlineBoostDetails.map((detail) => (
                  <Typography key={detail.bloodline} fontSize={fontSize}>
                    {detail.bloodline}: {formatPercentage(detail.boost)}
                  </Typography>
                ))}
              </Box>
            }
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Image
                src={bloodline_icon_url}
                alt={"Toil and Kin"}
                width={sizeIcon}
                height={sizeIcon}
              />
              <Typography fontSize={fontSize} color={fontColor}>
                +{formatPercentage(totalBloodlineBoost)}
              </Typography>
            </Box>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
};
