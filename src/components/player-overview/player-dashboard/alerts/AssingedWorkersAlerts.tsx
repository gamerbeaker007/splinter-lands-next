import { getDeedImg } from "@/lib/utils/deedUtil";
import { CountAlert } from "@/types/cardAlerts";
import { Box, Typography } from "@mui/material";

import React from "react";
import { PlotInfo } from "../../deed-overview/land-deed-card/info-sections/PlotInfo";
import { ManageLink } from "../../deed-overview/land-deed-card/link-components/ManageLink";

interface Props {
  assignedWorkersAlerts: CountAlert[];
}

export const AssignedWorkersAlerts: React.FC<Props> = ({
  assignedWorkersAlerts,
}) => {
  return (
    <Box mt={2}>
      <Box display={"flex"} flexWrap={"wrap"} gap={1} mb={1}>
        {assignedWorkersAlerts.map((alert, idx) => {
          const DeedImg = getDeedImg(
            alert.deedInfo.magicType,
            alert.deedInfo.deedType,
            alert.deedInfo.plotStatus,
            alert.deedInfo.rarity,
          );

          const regionNumber = alert.deedInfo.regionNumber;
          const plotNumber = alert.deedInfo.plotNumber;
          const tractNumber = alert.deedInfo.tractNumber;
          const regionName = alert.deedInfo.regionName;
          const territory = alert.deedInfo.territory;
          const deedType = alert.deedInfo.deedType;

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
                    Assigned Workers: {alert.assignedCards} / 5
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
