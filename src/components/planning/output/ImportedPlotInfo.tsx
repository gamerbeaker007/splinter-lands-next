import {
  land_region_icon_url,
  land_tract_icon_url,
  land_plot_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { Avatar, Box, Stack, Tooltip, Typography } from "@mui/material";
import React from "react";

type Props = {
  regionNumber: number;
  tractNumber: number;
  plotNumber: number;
  plotId: number;
};

export default function Import({
  regionNumber,
  tractNumber,
  plotNumber,
  plotId,
}: Props) {
  const iconSize = 20;
  const fontSize = "1rem";
  return (
    <Box sx={{ mt: 1 }}>
      <Tooltip
        title={
          "Started with imported data. This will not be updated if the plot is changed manually. " +
          "This is the point where you started with."
        }
        placement="top"
        arrow
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={1}
          sx={{
            width: "100%",
            minWidth: 300,
            maxWidth: 350,
            height: "100%",
          }}
        >
          <Typography
            variant="caption"
            fontSize={fontSize}
            color="text.secondary"
          >
            Import data:
          </Typography>

          <Avatar
            src={land_region_icon_url}
            alt="region"
            sx={{ width: iconSize, height: iconSize }}
          />
          <Typography variant="caption" fontSize={fontSize}>
            {regionNumber}
          </Typography>

          <Avatar
            src={land_tract_icon_url}
            alt="tract"
            sx={{ width: iconSize, height: iconSize }}
          />
          <Typography variant="caption" fontSize={fontSize}>
            {tractNumber}
          </Typography>

          <Avatar
            src={land_plot_icon_url}
            alt="plot"
            sx={{ width: iconSize, height: iconSize }}
          />
          <Typography variant="caption" fontSize={fontSize}>
            {plotNumber} (ID: {plotId})
          </Typography>
        </Stack>
      </Tooltip>
    </Box>
  );
}
