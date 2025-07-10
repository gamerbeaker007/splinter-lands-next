import React from "react";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Stack,
  Avatar,
} from "@mui/material";
import {
  land_plot_icon_url,
  land_region_icon_url,
  land_tract_icon_url,
  SPL_WEB_URL,
} from "@/lib/shared/statics_icon_urls";

type DeedTypeProps = {
  magicType: string;
  deedType: string;
  plotStatus: string;
  rarity: string;
  regionNumber: number;
  tractNumber: number;
  plotNumber: number;
  territory: string;
  regionName: string;
  worksiteType?: string;
  plotId: number;
};

const BASE_URL = "https://next.splinterlands.com/assets/lands/deedsSurveyed";

export default function DeedTypeCard({
  magicType,
  deedType,
  plotStatus,
  rarity,
  regionNumber,
  tractNumber,
  plotNumber,
  territory,
  regionName,
  worksiteType,
  plotId,
}: DeedTypeProps) {
  const lowerStatus = plotStatus.toLowerCase();
  const lowerRarity = rarity.toLowerCase();
  const lowerDeedType = deedType.toLowerCase();

  let cardImg: string;
  if (magicType) {
    cardImg = `${BASE_URL}/${lowerDeedType}_${lowerStatus}_${magicType}_${lowerRarity}.jpg`;
  } else if (lowerStatus === "kingdom") {
    cardImg = `${BASE_URL}/${lowerDeedType}_${lowerStatus}_${worksiteType?.toLowerCase()}.jpg`;
  } else {
    cardImg = `${BASE_URL}/${lowerDeedType}_${lowerStatus}_${lowerRarity}.jpg`;
  }

  const path = "assets/lands/deedAssets/";
  const imageUrl =
    deedType === "Unsurveyed Deed"
      ? null
      : `${SPL_WEB_URL}${path}img_geography-emblem_${lowerDeedType}.svg`;

  const linkUrl = `https://splinterlands.com/land/overview/praetoria/${regionNumber}/${plotId}`;

  return (
    <Card sx={{ width: 450, boxShadow: 10 }}>
      <CardActionArea
        component="a"
        href={linkUrl}
        target="_blank"
        sx={{
          position: "relative",
          width: "100%",
          paddingTop: "52.75%", // Correct aspect ratio: 422/800
          backgroundImage: `url(${cardImg})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          overflow: "hidden",
        }}
      >
        <CardContent
          sx={{
            position: "absolute", // overlay
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            p: 0,
          }}
        >
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt={deedType}
              sx={{ width: 50, height: 50, mx: "auto", mb: 1, mt: 6 }}
            />
          ) : (
            <Typography variant="h4" fontWeight="bold">
              ❓
            </Typography>
          )}

          <Typography variant="subtitle1" fontWeight="bold">
            {deedType}
          </Typography>
          <Typography variant="body2">
            {territory} | {regionName}
          </Typography>

          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{
              width: "50%",
              margin: "auto",
              backgroundColor: "rgba(240, 240, 240, 0.85)",
              color: "#333",
              borderRadius: 1,
              px: 2,
              py: 0.5,
              mt: 1,
            }}
          >
            <Avatar
              src={land_region_icon_url}
              alt="region"
              sx={{ width: 20, height: 20 }}
            />
            <Typography variant="caption">{regionNumber}</Typography>

            <Avatar
              src={land_tract_icon_url}
              alt="tract"
              sx={{ width: 20, height: 20 }}
            />
            <Typography variant="caption">{tractNumber}</Typography>

            <Avatar
              src={land_plot_icon_url}
              alt="plot"
              sx={{ width: 20, height: 20 }}
            />
            <Typography variant="caption">{plotNumber}</Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
