"use client";

import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { DeedAlertsInfo } from "@/types/deedAlertsInfo";
import {
  land_plot_icon_url,
  land_region_icon_url,
  land_tract_icon_url,
} from "@/lib/shared/statics_icon_urls";
import {
  getDeedImg,
  getHarvestRegion as getHarvestRegionLink,
  getManageLinkPlot,
} from "@/lib/utils/deedUtil";
import AgricultureIcon from "@mui/icons-material/Agriculture";

type Props = {
  alert: DeedAlertsInfo;
};

export const DeedAlertCard: React.FC<Props> = ({ alert }: Props) => {
  const linkUrl = getManageLinkPlot(alert.regionNumber, alert.plotId);
  const harvestLink = getHarvestRegionLink(alert.regionNumber);
  const cardImg = getDeedImg(
    alert.magicType,
    alert.deedType,
    alert.plotStatus,
    alert.rarity,
    alert.worksiteType,
  );

  return (
    <Card
      sx={{
        width: 250,
        height: 135,
        m: 1,
        position: "relative",
        overflow: "hidden",
        // border: "1px solid red",
        boxShadow: "0 0 10px rgba(255,0,0,0.5)",
      }}
    >
      <CardActionArea
        component="a"
        href={linkUrl}
        target="_blank"
        sx={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(${cardImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
          color: "white",
          textAlign: "center",
        }}
      >
        <IconButton
          component="span"
          onClick={(e) => {
            e.stopPropagation(); // prevent CardActionArea click
            window.open(harvestLink, "_blank");
          }}
          sx={{
            position: "absolute",
            top: 5,
            right: 6,
            zIndex: 10,
          }}
          size="small"
        >
          <AgricultureIcon fontSize="small" color="warning" />
        </IconButton>
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)", // dark overlay
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            px: 1,
          }}
        >
          {/* Region Info */}
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.85)",
              color: "#333",
              borderRadius: 1,
              px: 2,
              py: 0.5,
              mb: 1,
            }}
          >
            <Avatar
              src={land_region_icon_url}
              alt="region"
              sx={{ width: 20, height: 20 }}
            />
            <Typography variant="caption">{alert.regionNumber}</Typography>

            <Avatar
              src={land_tract_icon_url}
              alt="tract"
              sx={{ width: 20, height: 20 }}
            />
            <Typography variant="caption">{alert.tractNumber}</Typography>

            <Avatar
              src={land_plot_icon_url}
              alt="plot"
              sx={{ width: 20, height: 20 }}
            />
            <Typography variant="caption">{alert.plotNumber}</Typography>
          </Stack>

          {/* Alert Info */}
          <Typography
            variant="body2"
            color="error"
            fontWeight="bold"
            sx={{
              //backgroundColor: 'rgba(255,255,255,0.8)',
              border: "solid 1px",
              color: "red",
              borderRadius: 1,
              px: 1,
              mt: 1,
            }}
          >
            ⚠{" "}
            {alert.infoStr.startsWith("Finished")
              ? "Building Finished"
              : alert.infoStr}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
};
