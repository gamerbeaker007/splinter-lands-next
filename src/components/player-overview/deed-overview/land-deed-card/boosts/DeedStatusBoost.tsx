import React from "react";
import { Box, Typography, Avatar, Tooltip } from "@mui/material";
import { SPL_WEB_URL } from "@/lib/shared/statics_icon_urls";

export type RarityBoostProps = {
  plotStatus: string;
  boost: number;
};

export const DeedStatusBoost: React.FC<RarityBoostProps> = ({
  plotStatus,
  boost,
}) => {
  if (
    plotStatus.toLowerCase() != "magical" &&
    plotStatus.toLowerCase() != "occupied"
  ) {
    return <></>;
  }

  const boostPercent = boost * 100;
  const imgUrl = `${SPL_WEB_URL}assets/lands/sideMenu/${plotStatus.toLowerCase()}Off.svg`;

  return (
    <Tooltip title={"Deed Status Boost"}>
      <Box textAlign="center">
        <Box>
          <Typography fontWeight="bold" fontFamily="monospace" fontSize="14px">
            {boostPercent.toFixed(0)}%
          </Typography>
          <Box mt={0.5} justifyItems={"center"}>
            <Avatar
              variant="square"
              src={imgUrl}
              alt={plotStatus}
              sx={{ width: 55, height: 55 }}
            />
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
};
