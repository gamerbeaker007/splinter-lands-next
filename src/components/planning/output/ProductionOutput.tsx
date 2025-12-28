import {
  land_hammer_icon_url,
  totem_fragment_common_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";
import PPWarning from "./PPWarning";
import { FaPercent } from "react-icons/fa";

type Props = {
  totalBasePP: number;
  totalBoostPP: number;
  capped: boolean;
  captureRate?: number;
  totemChance?: number;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const sizeIcon = 20;
const fontSize = "1.0rem";

export const ProductionOutput: React.FC<Props> = ({
  totalBasePP,
  totalBoostPP,
  capped,
  captureRate,
  totemChance,
  pos,
}) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  const fontColor = "common.white";

  return (
    <Box
      borderRadius={1}
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        p: 1,
        zIndex: 2,
      }}
    >
      <Box display="flex" flexDirection="column" minWidth="210px">
        <Typography
          fontSize="1.5rem"
          fontWeight="bold"
          color={fontColor}
          mb={0.5}
        >
          Production: {capped && <PPWarning />}
        </Typography>

        {/* Base PP */}
        <Box display="flex" alignItems="center" gap={1} ml={0.5}>
          <Image
            src={land_hammer_icon_url}
            alt="production PP"
            width={sizeIcon}
            height={sizeIcon}
            style={{ display: "block" }}
          />
          <Box display="flex" justifyContent="space-between" flex={1}>
            <Typography fontSize={fontSize} color={fontColor}>
              Base PP:
            </Typography>
            <Typography fontSize={fontSize} fontWeight="bold" color={fontColor}>
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
            width={sizeIcon}
            height={sizeIcon}
            style={{ display: "block" }}
          />
          <Box display="flex" justifyContent="space-between" flex={1}>
            <Typography fontSize={fontSize} color={fontColor}>
              Boosted PP:
            </Typography>
            <Typography
              fontSize={fontSize}
              fontWeight="bold"
              color="success.main"
            >
              {totalBoostPP.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </Typography>
          </Box>
        </Box>

        {/* if present capture Rate  */}
        {typeof captureRate === "number" && !isNaN(captureRate) && (
          <Box display="flex" alignItems="center" gap={1} ml={0.5} mt={0.5}>
            <FaPercent color="orange" size={sizeIcon} />
            <Box display="flex" justifyContent="space-between" flex={1}>
              <Typography fontSize={fontSize} color={fontColor}>
                Capture Rate:
              </Typography>
              <Typography
                fontSize={fontSize}
                fontWeight="bold"
                color="success.main"
              >
                {(captureRate * 100).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
                %
              </Typography>
            </Box>
          </Box>
        )}

        {/* if present totem Chance */}
        {typeof totemChance === "number" && !isNaN(totemChance) && (
          <Box display="flex" alignItems="center" gap={1} ml={0.5} mt={0.5}>
            <Image
              src={totem_fragment_common_icon_url}
              alt="Totem fragment"
              width={sizeIcon}
              height={sizeIcon}
              style={{ display: "block" }}
            />
            <Box display="flex" justifyContent="space-between" flex={1}>
              <Typography fontSize={fontSize} color={fontColor}>
                Totem Chance /h:
              </Typography>
              <Typography
                fontSize={fontSize}
                fontWeight="bold"
                color="success.main"
              >
                {totemChance.toLocaleString(undefined, {
                  maximumFractionDigits: 3,
                })}
                %
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
