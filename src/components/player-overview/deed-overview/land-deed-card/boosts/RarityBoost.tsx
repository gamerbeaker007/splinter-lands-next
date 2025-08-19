import React from "react";
import { Box, Typography, Avatar, Tooltip } from "@mui/material";
import { SPL_WEB_URL } from "@/lib/shared/statics_icon_urls";

export type RarityBoostProps = {
  rarity: string;
  boost: number;
};

export const RarityBoost: React.FC<RarityBoostProps> = ({ rarity, boost }) => {
  if (rarity.toLowerCase() === "mythic" || rarity.toLowerCase() === "common") {
    return <></>;
  }

  const boostPercent = boost * 100;
  const imgUrl = `${SPL_WEB_URL}assets/lands/sideMenu/${rarity.toLowerCase()}Off.svg`;

  return (
    <Tooltip title={"Rarity Boost"}>
      <Box textAlign="center">
        <Typography fontWeight="bold" fontFamily="monospace" fontSize="14px">
          {boostPercent.toFixed(0)}%
        </Typography>
        <Box mt={0.5} justifyItems={"center"}>
          <Avatar
            variant="square"
            src={imgUrl}
            alt={rarity}
            sx={{ width: 55, height: 55 }}
          />
        </Box>
      </Box>
    </Tooltip>
  );
};
