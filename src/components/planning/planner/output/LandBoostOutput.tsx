import {
  determineBloodlineBoost,
  determineGrainConsumeReduction,
  determineProductionBoost,
} from "@/lib/frontend/utils/plannerCalcs";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import {
  bloodline_icon_url,
  land_runi_power_core_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import {
  CardBloodline,
  PlotPlannerData,
  resourceWorksiteMap,
} from "@/types/planner";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";
import { PiCloverFill } from "react-icons/pi";

type Props = {
  plotPlannerData: PlotPlannerData;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const sizeIcon = 20;
const fontSize = "0.8rem";
const fontColor = "common.white";

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
    (card) => card.landBoosts?.replacePowerCore,
  );

  // Count Labor Luck
  const laborLuckCount = cardInput.filter(
    (card) => card.landBoosts?.laborLuck,
  ).length;

  // Calculate total bloodline boost using the function
  const totalBloodlineBoost = determineBloodlineBoost(cardInput);

  // Get breakdown of bloodline boosts for tooltip
  const bloodlineBoostBreakdown: Record<CardBloodline, number> = {} as Record<
    CardBloodline,
    number
  >;

  cardInput.forEach((card) => {
    const boosts = card.landBoosts?.bloodlineBoost;
    if (!boosts) return;

    Object.entries(boosts).forEach(([bloodline, value]) => {
      if (value > 0) {
        const currentValue =
          bloodlineBoostBreakdown[bloodline as CardBloodline] || 0;
        bloodlineBoostBreakdown[bloodline as CardBloodline] = Math.max(
          currentValue,
          value,
        );
      }
    });
  });

  // Check which bloodlines are present on the plot
  const bloodlinesOnPlot = new Set<CardBloodline>(
    cardInput.map((card) => card.bloodline),
  );

  // Filter to only show boosts for bloodlines present on plot
  const activeBloodlineBoosts = Object.entries(bloodlineBoostBreakdown).filter(
    ([bloodline]) => bloodlinesOnPlot.has(bloodline as CardBloodline),
  );

  const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;

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
        minHeight: "145px",
      }}
    >
      <Stack spacing={1}>
        <Typography fontSize="1.0rem" fontWeight="bold" color={fontColor}>
          Land Boosts:
        </Typography>
        {/* DEC Discount */}
        <Stack direction="row" spacing={0.75} flexWrap="wrap">
          {totalDecDiscount > 0 && (
            <Tooltip title="Dark Discount">
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <Image
                  src={RESOURCE_ICON_MAP.DEC}
                  alt="DEC"
                  width={sizeIcon}
                  height={sizeIcon}
                />
                <Typography fontSize={fontSize} color={fontColor}>
                  {formatPercentage(totalDecDiscount)}
                </Typography>
              </Box>
            </Tooltip>
          )}

          {/* Production Boosts */}
          {productionBoosts > 0 && (
            <Tooltip
              key={resource}
              title={`Bountiful ${resource.charAt(0).toUpperCase() + resource.slice(1).toLowerCase()}`}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}>
                <Image
                  src={RESOURCE_ICON_MAP[resource]}
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
              <Tooltip title="Rationing">
                <Box
                  sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}
                >
                  <Image
                    src={RESOURCE_ICON_MAP["GRAIN"]}
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
        </Stack>

        <Stack direction="row" spacing={5} flexWrap="wrap">
          {/* Replace Power Core */}
          {hasReplacePowerCore && (
            <Tooltip title="Energized">
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Image
                  src={land_runi_power_core_icon_url}
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
            <Tooltip title="Labor's Luck">
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <PiCloverFill color="green" size={sizeIcon} />
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
                {activeBloodlineBoosts.map(([bloodline, boost]) => (
                  <Typography key={bloodline} fontSize={fontSize}>
                    {bloodline}: {formatPercentage(boost)}
                  </Typography>
                ))}
              </Box>
            }
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
