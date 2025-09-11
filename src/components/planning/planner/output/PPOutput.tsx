import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";
import PPWarning from "./PPWarning";
import { FaPercent } from "react-icons/fa";

type Props = {
  totalBasePP: number;
  totalBoostPP: number;
  captureRate: number | null;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const sizeIcon = 20;
const fontSize = "1.0rem";

export const PPOutput: React.FC<Props> = ({
  totalBasePP,
  totalBoostPP,
  captureRate,
  pos,
}) => {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

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
          color={"white"}
          mb={0.5}
        >
          Production: {totalBasePP > 100_000 && <PPWarning />}
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
            <Typography fontSize={fontSize} color="common.white">
              Base PP:
            </Typography>
            <Typography
              fontSize={fontSize}
              fontWeight="bold"
              color="common.white"
            >
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
            <Typography fontSize={fontSize} color="common.white">
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

        {/* Add capture rate on castle and keeps */}
        {captureRate && (
          <Box display="flex" alignItems="center" gap={1} ml={0.5} mt={0.5}>
            <FaPercent size={sizeIcon} color={"orange"} />
            <Box display="flex" justifyContent="space-between" flex={1}>
              <Typography fontSize={fontSize} color="common.white">
                Capture rate:
              </Typography>
              <Typography
                fontSize={fontSize}
                fontWeight="bold"
                color="success.main"
              >
                {(captureRate * 100).toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
