import { getDeedImg } from "@/lib/utils/deedUtil";
import { Box, Typography } from "@mui/material";

import { DeedInfo } from "@/types/cardAlerts";
import React from "react";
import { PlotInfo } from "../../deed-overview/land-deed-card/info-sections/PlotInfo";
import { ManageLink } from "../../deed-overview/land-deed-card/link-components/ManageLink";

interface Props {
  missingBloodLineBoost: DeedInfo[];
}

export const MissingBloodLineBoostAlerts: React.FC<Props> = ({
  missingBloodLineBoost,
}) => {
  return (
    <Box mt={2}>
      <Box display={"flex"} flexWrap={"wrap"} gap={1} mb={1}>
        {missingBloodLineBoost.map((alert, idx) => {
          const DeedImg = getDeedImg(
            alert.magicType,
            alert.deedType,
            alert.plotStatus,
            alert.rarity,
            alert.worksiteType
          );

          const regionNumber = alert.regionNumber;
          const plotNumber = alert.plotNumber;
          const tractNumber = alert.tractNumber;
          const regionName = alert.regionName;
          const territory = alert.territory;
          const deedType = alert.deedType;

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
                  regionNumber={alert.regionNumber}
                  plotId={alert.plotId}
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
                <PlotInfo
                  deedType={deedType}
                  territory={territory}
                  regionName={regionName}
                  regionNumber={regionNumber}
                  tractNumber={tractNumber}
                  plotNumber={plotNumber}
                  pos={{ x: "20px", y: "0px", w: "auto" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    left: "20px",
                    top: "115px",
                    width: "auto",
                    textAlign: "left",
                  }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={600}
                    color="warning"
                    sx={{ mt: 1, ml: 1 }}
                  >
                    Missing Bloodline Boost
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
