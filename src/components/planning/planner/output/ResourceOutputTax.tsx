import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { CSSSize } from "@/types/cssSize";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";
import { WorksiteType } from "@/types/planner";
import { RegionTax } from "@/types/regionTax";
import { Prices } from "@/types/price";
import { calcDECPrice } from "@/lib/shared/costCalc";
import LoadingComponent from "@/components/ui/LoadingComponent";
import ErrorComponent from "@/components/ui/ErrorComponent";

type Props = {
  regionNumber: number;
  tractNumber: number;
  worksiteType: WorksiteType;
  captureRate: number;
  prices: Prices;
  regionTax?: RegionTax[] | null;
  loading?: boolean;
  error?: string | null;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const TAX_RATE = 0.9; // 10% tax rate reduced from production

export const ResourceOutputTax: React.FC<Props> = ({
  worksiteType,
  regionNumber,
  tractNumber,
  captureRate,
  prices,
  regionTax,
  loading,
  error,
  pos,
}) => {
  if (loading) {
    return <LoadingComponent title={"Loading region tax info…"} />;
  }

  if (error) {
    return (
      <ErrorComponent title={`Failed to load region tax info: ${error}`} />
    );
  }

  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  const fontSize = "1.0rem";
  const iconSize = 25;

  const consume = worksiteType === "KEEP" ? 1000 : 10_000;

  const region = regionTax?.find(
    (r) => r.castleOwner?.regionNumber === regionNumber,
  );

  const rewardsPerHour =
    worksiteType === "KEEP"
      ? region?.perTract?.[String(tractNumber ?? "")]?.resourceRewardsPerHour
      : region?.resourceRewardsPerHour;

  const capturedTaxInResource: Record<string, number> = {};
  for (const resource of Object.keys(rewardsPerHour ?? [])) {
    if (rewardsPerHour) {
      capturedTaxInResource[resource] =
        rewardsPerHour[resource] * TAX_RATE * captureRate;
    }
  }

  const consumeDEC = calcDECPrice("buy", "GRAIN", consume, prices);

  const produceDEC = Object.entries(capturedTaxInResource).reduce(
    (sum, [res, amount]) => sum + calcDECPrice("sell", res, amount, prices),
    0,
  );

  const netDEC = produceDEC - consumeDEC;

  return (
    <Box
      borderRadius={1}
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        zIndex: 2,
      }}
    >
      <Box display="flex" flexDirection="column" width="100%">
        <Box>
          <Typography
            fontSize="1.0rem"
            fontWeight="bold"
            color="white"
            mb={0.5}
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            Collect:
          </Typography>

          {Object.entries(capturedTaxInResource).map(([resource, value]) => {
            const icon = RESOURCE_ICON_MAP[resource];
            return (
              <Box
                key={resource}
                display="flex"
                alignItems="center"
                gap={0.5}
                mb={0.25}
                ml={1}
              >
                {icon && (
                  <Image
                    src={icon}
                    alt={resource}
                    width={iconSize}
                    height={iconSize}
                  />
                )}
                <Typography fontSize={fontSize}>
                  {value.toFixed(3)} /h
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box>
          <Typography
            fontSize="1.0rem"
            fontWeight="bold"
            color="white"
            mb={0.5}
          >
            Consume:
          </Typography>

          <Box display="flex" alignItems="center" gap={0.5} mb={0.25} ml={1}>
            <Image
              src={RESOURCE_ICON_MAP["GRAIN"]}
              alt={"GRAIN"}
              width={iconSize}
              height={iconSize}
            />
            <Typography fontSize={fontSize}>{consume.toFixed(0)}</Typography>
          </Box>
        </Box>
        <Box mt={1}>
          <Typography
            fontSize="1.0rem"
            fontWeight="bold"
            color="white"
            mb={0.5}
          >
            Net DEC:
          </Typography>

          <Box display="flex" alignItems="center" gap={0.5} mb={0.25} ml={1}>
            <Image
              src={RESOURCE_ICON_MAP["DEC"]}
              alt={"DEC"}
              width={iconSize}
              height={iconSize}
            />
            <Typography fontSize={fontSize}>{netDEC.toFixed(3)} /h</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
