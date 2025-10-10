import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { CSSSize } from "@/types/cssSize";
import { WorksiteType } from "@/types/planner";
import { ProductionInfo } from "@/types/productionInfo";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";
import TaxWarning from "./TaxWarning";
import { RESOURCES } from "@/constants/resource/resource";

type Props = {
  worksiteType: WorksiteType;
  productionInfo: ProductionInfo;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const ResourceOutput: React.FC<Props> = ({
  worksiteType,
  productionInfo,
  pos,
}) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  const fontSize = "1.0rem";
  const iconSize = 25;

  const isTax = worksiteType === "CASTLE" || worksiteType === "KEEP";
  const suffix = isTax ? "" : "/h";

  (productionInfo.produce ?? []).sort(
    (a, b) => RESOURCES.indexOf(a.resource) - RESOURCES.indexOf(b.resource),
  );

  (productionInfo.consume ?? []).sort(
    (a, b) => RESOURCES.indexOf(a.resource) - RESOURCES.indexOf(b.resource),
  );

  const fontColor = "common.white";

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
            color={fontColor}
            mb={0.5}
            display="flex"
            alignItems="center"
            gap={0.5}
          >
            Produce:
            {isTax && <TaxWarning />}
          </Typography>

          {productionInfo.produce?.map((row, idx) => {
            const icon = RESOURCE_ICON_MAP[row.resource];
            return (
              <Box
                key={idx}
                display="flex"
                alignItems="center"
                gap={0.5}
                mb={0.5}
                ml={1}
              >
                <Image
                  src={icon}
                  alt={row.resource}
                  width={iconSize}
                  height={iconSize}
                />
                <Typography fontSize={fontSize} color={fontColor}>
                  {row.amount.toFixed(3)} /h
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box>
          <Typography
            fontSize="1.0rem"
            fontWeight="bold"
            color={fontColor}
            mb={0.5}
          >
            Consume:
          </Typography>

          {productionInfo.consume?.map((row, idx) => {
            const icon = RESOURCE_ICON_MAP[row.resource];
            return (
              <Box
                key={idx}
                display="flex"
                alignItems="center"
                gap={0.5}
                mb={0.25}
                ml={1}
              >
                {icon && (
                  <Image
                    src={icon}
                    alt={row.resource}
                    width={iconSize}
                    height={iconSize}
                  />
                )}
                <Typography fontSize={fontSize} color={fontColor}>
                  {row.amount.toFixed(3)} {suffix}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
