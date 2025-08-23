import { land_hammer_icon_url } from "@/lib/shared/statics_icon_urls";
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import React from "react";

type Props = {
  basePP: number;
  boostedPP: number;
};

const sizeHammerIcon = 15;
const fontSize = 10;

export const CardPPInfo: React.FC<Props> = ({ basePP, boostedPP }) => {
  return (
    <Box display={"flex"} flexDirection={"column"} mt={0.5} width={"100%"}>
      <Box display="flex" alignItems="center" gap={1} ml={0.5}>
        <Image
          src={land_hammer_icon_url}
          alt="production PP"
          width={sizeHammerIcon}
          height={sizeHammerIcon}
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
            {basePP.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
        </Box>
      </Box>

      {/* Boosted PP */}
      <Box display="flex" alignItems="center" gap={1} ml={0.5} mt={0.5}>
        <Image
          src={land_hammer_icon_url}
          alt="production PP"
          width={sizeHammerIcon}
          height={sizeHammerIcon}
          style={{ display: "block" }}
        />
        <Box display="flex" justifyContent="space-between" flex={1}>
          <Typography fontSize={fontSize} color="common.white">
            Boosted PP:
          </Typography>
          <Typography fontSize={fontSize} fontWeight="bold" color="success">
            {boostedPP.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
