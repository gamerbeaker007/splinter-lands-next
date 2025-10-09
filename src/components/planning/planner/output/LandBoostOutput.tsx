import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import {
  bloodline_icon_url,
  land_runi_power_core_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { PlotPlannerData } from "@/types/planner";
import { resourceWorksiteMap } from "@/types/planner/primitives";
import { Box, Chip, Stack, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

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
  const worksiteResource = worksiteType
    ? resourceWorksiteMap[worksiteType]
    : null;
  const productionBoosts = new Map<string, number>();

  if (worksiteResource) {
    cardInput.forEach((card) => {
      if (card.landBoosts?.produceBoost) {
        Object.entries(card.landBoosts.produceBoost).forEach(
          ([resource, boost]) => {
            if (resource === worksiteResource && boost > 0) {
              productionBoosts.set(
                resource,
                (productionBoosts.get(resource) || 0) + boost,
              );
            }
          },
        );
      }
    });
  }

  // Calculate Consumption Discounts
  const consumptionDiscounts = new Map<string, number>();
  cardInput.forEach((card) => {
    if (card.landBoosts?.consumeDiscount) {
      Object.entries(card.landBoosts.consumeDiscount).forEach(
        ([resource, discount]) => {
          if (discount > 0) {
            consumptionDiscounts.set(
              resource,
              (consumptionDiscounts.get(resource) || 0) + discount,
            );
          }
        },
      );
    }
  });

  // Check for Replace Power Core
  const hasReplacePowerCore = cardInput.some(
    (card) => card.landBoosts?.replacePowerCore,
  );

  // Count Labor Luck
  const laborLuckCount = cardInput.filter(
    (card) => card.landBoosts?.laborLuck,
  ).length;

  // Calculate Bloodline Boosts (grouped by bloodline)
  const bloodlineBoosts = new Map<string, number>();
  cardInput.forEach((card) => {
    if (card.landBoosts?.bloodlineBoost && card.landBoosts.bloodlineBoost > 0) {
      const bloodline = card.landBoosts.bloodline;
      bloodlineBoosts.set(
        bloodline,
        (bloodlineBoosts.get(bloodline) || 0) + card.landBoosts.bloodlineBoost,
      );
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
        <Typography
          fontSize="1.0rem"
          fontWeight="bold"
          color={fontColor}
          mb={0.5}
        >
          Land Boosts:
        </Typography>
        {/* DEC Discount */}
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          {totalDecDiscount > 0 && (
            <Tooltip title="DEC Discount">
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
          {Array.from(productionBoosts.entries()).map(([resource, boost]) => (
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
                  +{formatPercentage(boost)}
                </Typography>
              </Box>
            </Tooltip>
          ))}

          {/* Consumption Discounts */}
          <Stack spacing={0.5}>
            {Array.from(consumptionDiscounts.entries()).map(
              ([resource, discount]) => (
                <Tooltip key={resource} title="Rationing">
                  <Box
                    sx={{ display: "flex", alignItems: "flex-start", gap: 0.5 }}
                  >
                    <Image
                      src={RESOURCE_ICON_MAP[resource]}
                      alt={resource}
                      width={sizeIcon}
                      height={sizeIcon}
                    />
                    <Typography fontSize={fontSize} color={fontColor}>
                      -{formatPercentage(discount)}
                    </Typography>
                  </Box>
                </Tooltip>
              ),
            )}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={5} flexWrap="wrap">
          {/* Replace Power Core */}
          {hasReplacePowerCore && (
            <Tooltip title="Power Core Replacement">
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
              <Typography fontSize={fontSize} color={fontColor}>
                🍀 {laborLuckCount}
              </Typography>
            </Tooltip>
          )}
        </Stack>

        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          <Image
            src={bloodline_icon_url}
            alt={"Bloodline"}
            width={sizeIcon}
            height={sizeIcon}
          />

          {/* Bloodline Boosts */}
          {Array.from(bloodlineBoosts.entries()).map(([bloodline, boost]) => (
            <Tooltip key={bloodline} title={`Toil and Kin - ${bloodline}`}>
              <Chip
                label={formatPercentage(boost)}
                size="small"
                variant="outlined"
                sx={{ fontSize: fontSize, color: fontColor }}
              />
            </Tooltip>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
};
