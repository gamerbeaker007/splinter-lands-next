import { getDeedImg } from "@/lib/utils/deedUtil";
import { TerrainCardInfo } from "@/types/cardAlerts";
import { Avatar, Box, Stack, Typography } from "@mui/material";

import {
  land_plot_icon_url,
  land_region_icon_url,
  land_tract_icon_url,
} from "@/lib/shared/statics_icon_urls";
import React from "react";
import CardTile from "../../deed-overview/land-deed-card/card/CardTile";
import { ManageLink } from "../../deed-overview/land-deed-card/link-components/ManageLink";

interface Props {
  terrainBoosts: TerrainCardInfo[];
}

export const TerrainBoostsCard: React.FC<Props> = ({ terrainBoosts }) => {
  const iconSize = 24;
  const fontSize = 14;

  // Group alerts by plotId
  const groupedByPlot = terrainBoosts.reduce<Record<string, TerrainCardInfo[]>>(
    (acc, alert) => {
      const plotId = alert.deedInfo.plotId;
      if (!acc[plotId]) acc[plotId] = [];
      acc[plotId].push(alert);
      return acc;
    },
    {},
  );

  return (
    <Box mt={2}>
      <Box display={"flex"} flexWrap={"wrap"} gap={1} mb={1}>
        {Object.values(groupedByPlot).map((alerts) => {
          const firstAlert = alerts[0];
          const DeedImg = getDeedImg(
            firstAlert.deedInfo.magicType,
            firstAlert.deedInfo.deedType,
            firstAlert.deedInfo.plotStatus,
            firstAlert.deedInfo.rarity,
          );

          return (
            <Box
              key={firstAlert.deedInfo.plotId}
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: "500px",
                aspectRatio: "800 / 422",
                mb: 3,
                overflow: "hidden",
                backgroundSize: "cover",
                backgroundPosition: "center",
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                backgroundImage: `url(${DeedImg})`,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.45)",
                  zIndex: 1,
                }}
              />
              <Box position={"absolute"} top={16} right={16} zIndex={3}>
                <ManageLink
                  regionNumber={firstAlert.deedInfo.regionNumber}
                  plotId={firstAlert.deedInfo.plotId}
                />
              </Box>
              <Box
                position={"relative"}
                zIndex={2}
                color={"#fff"}
                display={"flex"}
                flexDirection={"column"}
                height={"100%"}
              >
                <Box
                  sx={{
                    position: "absolute",
                    width: "100%",
                    justifyItems: "center",
                    justifyContent: "center",
                    display: "flex",
                    top: "50%",
                    transform: "translateY(-50%)",
                    padding: 1,
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  {alerts.map((alert, i) => (
                    <CardTile
                      key={alert.uid || i}
                      name={alert.cardName}
                      rarity={alert.rarity}
                      edition={alert.edition}
                      foil={alert.foil}
                      terrain_boost={alert.terrainBoost}
                      actual_bcx={alert.bcx}
                      max_bcx={alert.maxBcx}
                      base_pp={alert.basePP}
                      uid={alert.uid}
                    />
                  ))}
                </Box>
                <Box
                  sx={{
                    position: "absolute",
                    bottom: "10px",
                    width: "100%",
                    textAlign: "center",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                    mt={1}
                    mb={2}
                    sx={{
                      // width: "90%",
                      minWidth: 160,
                      maxWidth: 240,
                      backgroundColor: "rgba(240, 240, 240, 0.85)",
                      color: "#333",
                      borderRadius: 1,
                      py: 0.5,
                      mx: "auto",
                    }}
                  >
                    <Avatar
                      src={land_region_icon_url}
                      alt="region"
                      sx={{ width: iconSize, height: iconSize }}
                    />
                    <Typography variant="caption" fontSize={fontSize}>
                      {firstAlert.deedInfo.regionNumber}
                    </Typography>

                    <Avatar
                      src={land_tract_icon_url}
                      alt="tract"
                      sx={{ width: iconSize, height: iconSize }}
                    />
                    <Typography variant="caption" fontSize={fontSize}>
                      {firstAlert.deedInfo.tractNumber}
                    </Typography>

                    <Avatar
                      src={land_plot_icon_url}
                      alt="plot"
                      sx={{ width: iconSize, height: iconSize }}
                    />
                    <Typography variant="caption" fontSize={fontSize}>
                      {firstAlert.deedInfo.plotNumber}
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
