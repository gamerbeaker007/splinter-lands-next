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
  const bloodlineBoostDetails: Array<{
    bloodline: CardBloodline;
    boost: number;
  }> = [];

  // First, collect the maximum bloodline boost for each bloodline
  const maxBloodlineBoosts: Record<string, number> = {};

  cardInput.forEach((card) => {
    const boost = card.landBoosts?.bloodlineBoost;
    if (!boost || boost <= 0) return;

    const cardBloodline = card.bloodline;
    const currentMax = maxBloodlineBoosts[cardBloodline] || 0;
    maxBloodlineBoosts[cardBloodline] = Math.max(currentMax, boost);
  });

  // Then, determine which bloodlines are actually present with other cards
  Object.entries(maxBloodlineBoosts).forEach(([bloodline, boost]) => {
    const bloodlineType = bloodline as CardBloodline;

    // Count how many cards have this bloodline (with bcx > 0)
    const cardsWithBloodline = cardInput.filter(
      (card) => card.bloodline === bloodlineType && card.bcx > 0,
    );

    // Add to details only if there are at least 2 cards with this bloodline
    if (cardsWithBloodline.length >= 2) {
      bloodlineBoostDetails.push({ bloodline: bloodlineType, boost });
    }
  });

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
                {bloodlineBoostDetails.map((detail) => (
                  <Typography key={detail.bloodline} fontSize={fontSize}>
                    {detail.bloodline}: {formatPercentage(detail.boost)}
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
