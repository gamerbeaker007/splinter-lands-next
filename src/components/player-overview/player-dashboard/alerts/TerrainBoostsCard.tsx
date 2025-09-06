import { getDeedImg } from "@/lib/utils/deedUtil";
import { TerrainCardInfo } from "@/types/cardAlerts";
import { Box } from "@mui/material";

import React from "react";
import CardTile from "../../deed-overview/land-deed-card/card/CardTile";
import { ManageLink } from "../../deed-overview/land-deed-card/link-components/ManageLink";

interface Props {
  terrainBoosts: TerrainCardInfo[];
}

export const TerrainBoostsCard: React.FC<Props> = ({
  terrainBoosts: negativeBoosts,
}) => {
  return (
    <Box mt={2}>
      <Box display={"flex"} flexWrap={"wrap"} gap={1} mb={1}>
        {negativeBoosts.map((alert, idx) => {
          const DeedImg = getDeedImg(
            alert.deedInfo.magicType,
            alert.deedInfo.deedType,
            alert.deedInfo.plotStatus,
            alert.deedInfo.rarity,
          );

          return (
            <Box
              key={idx}
              sx={{
                position: "relative",
                width: "100%",
                maxWidth: "300px",
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
                  regionNumber={alert.deedInfo.regionNumber}
                  plotId={alert.deedInfo.plotId}
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
                  }}
                >
                  <CardTile
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
                </Box>
                <Box
                  sx={{
                    position: "absolute",
                    top: "115px",
                    width: "100%",
                    textAlign: "center",
                  }}
                ></Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
