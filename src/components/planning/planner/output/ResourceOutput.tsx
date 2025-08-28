import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import { CSSSize } from "@/types/cssSize";
import { ProductionInfo } from "@/types/productionInfo";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";
import SPSWarning from "./SPSWarning";

type Props = {
  productionInfo: ProductionInfo;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export const ResourceOutput: React.FC<Props> = ({ productionInfo, pos }) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  const produce = productionInfo.produce ?? null; // be safe in case it's null
  const produceIcon = produce ? RESOURCE_ICON_MAP[produce.resource] : undefined;

  const fontSize = "1.0rem";
  const iconSize = 25;

  const isSps = produce?.resource === "SPS";

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
            Produce:
            {isSps && <SPSWarning />}
          </Typography>

          {produce && (
            <Box display="flex" alignItems="center" gap={0.5} mb={0.5} ml={1}>
              {produceIcon && (
                <Image
                  src={produceIcon}
                  alt={produce.resource}
                  width={iconSize}
                  height={iconSize}
                />
              )}
              <Typography fontSize={fontSize}>
                {produce.amount.toFixed(3)} /h
              </Typography>
            </Box>
          )}
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
                <Typography fontSize={fontSize}>
                  {row.amount.toFixed(3)} /h
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
