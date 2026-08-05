import { SPL_WEB_URL } from "@/lib/shared/statics_icon_urls";
import { Avatar, Box, Tooltip, Typography } from "@mui/material";
import React from "react";

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
          <Typography
            fontWeight="bold"
            fontFamily="monospace"
            fontSize="1.1rem"
          >
            {boostPercent.toFixed(0)}%
          </Typography>
          <Box mt={0.5} justifyItems={"center"}>
            <Avatar
              variant="square"
              src={imgUrl}
              alt={plotStatus}
              sx={{ width: 45, height: 45 }}
            />
          </Box>
        </Box>
      </Box>
    </Tooltip>
  );
};
