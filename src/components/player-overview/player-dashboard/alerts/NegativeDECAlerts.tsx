import { getDeedImg } from "@/lib/utils/deedUtil";
import { NegativeDecAlert } from "@/types/cardAlerts";
import { Box, Typography } from "@mui/material";

import { worksiteTypeMapping } from "@/lib/shared/statics";
import { land_under_construction_icon_url } from "@/lib/shared/statics_icon_urls";
import React from "react";
import { ManageLink } from "../../deed-overview/land-deed-card/link-components/ManageLink";

interface Props {
  negativeDECAlerts: NegativeDecAlert[];
}

const fontSize = 12;

export const NegativeDECAlerts: React.FC<Props> = ({ negativeDECAlerts }) => {
  return (
    <Box mt={2}>
      <Box display={"flex"} flexWrap={"wrap"} gap={1} mb={1}>
        {negativeDECAlerts.map((alert, idx) => {
          const DeedImg = getDeedImg(
            alert.deedInfo.magicType,
            alert.deedInfo.deedType,
            alert.deedInfo.plotStatus,
            alert.deedInfo.rarity
          );

          const worksiteImage =
            worksiteTypeMapping[alert.deedInfo.worksiteType ?? ""] ??
            land_under_construction_icon_url;

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
                height={"100%"}
                justifyContent={"center"}
                alignItems={"center"}
                justifyItems={"center"}
              >
                <Box
                  sx={{
                    position: "absolute",
                    left: 10,
                    top: 10,
                    width: "auto",
                    textAlign: "left",
                  }}
                >
                  <Box
                    borderRadius={1}
                    minHeight={100}
                    display={"flex"}
                    flexDirection={"row"}
                    alignItems={"center"}
                    padding={1}
                  >
                    <Box
                      sx={{
                        width: 110,
                        height: 80,
                        backgroundImage: `url(${worksiteImage})`,
                        backgroundSize: "95%",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center center",
                      }}
                    />
                    <Box display={"flex"} flexDirection={"column"}>
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        color="primary.secondary"
                        sx={{ mt: 1, ml: 1 }}
                      >
                        Worksite:
                      </Typography>{" "}
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        color="primary.main"
                        sx={{ mt: 1, ml: 1 }}
                      >
                        {`${alert.deedInfo.worksiteType}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    justifyContent={"center"}
                    alignItems={"center"}
                    display={"flex"}
                    borderRadius={2}
                    sx={{
                      backgroundColor: "rgba(240, 240, 240, 0.85)",
                    }}
                  >
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      fontSize={fontSize}
                      color="error"
                    >
                      {`${alert.negativeDecPerHour.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DEC/h`}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    position: "absolute",
                    left: "20px",
                    top: "115px",
                    width: "auto",
                    textAlign: "left",
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
