import React from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { SPL_WEB_URL } from "@/scripts/statics_icon_urls";

export type RarityBoostProps = {
  rarity: string;
  boost: number;
};

export const RarityBoost: React.FC<RarityBoostProps> = ({ rarity, boost }) => {
  if (rarity.toLowerCase() === "mythic" || rarity.toLowerCase() === "common") {
    return <div />;
  }

  const boostPercent = boost * 100;
  const imgUrl = `${SPL_WEB_URL}assets/lands/sideMenu/${rarity.toLowerCase()}Off.svg`;

  return (
    <Box textAlign="center" sx={{ width: 65, height: 100, ml: 1 }}>
      <Box>
        <Typography fontWeight="bold" fontFamily="monospace" fontSize="14px">
          {boostPercent.toFixed(0)}%
        </Typography>
        <Box mt={0.5} justifyItems={"center"}>
          <Avatar
            variant="square"
            src={imgUrl}
            alt={rarity}
            sx={{ width: 50, height: 50 }}
          />
        </Box>
      </Box>
    </Box>
  );
};
