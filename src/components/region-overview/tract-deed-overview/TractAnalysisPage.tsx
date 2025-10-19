"use client";

import { LandDeedCard } from "@/components/player-overview/deed-overview/land-deed-card/LandDeedCard";
import LoadingComponent from "@/components/ui/LoadingComponent";
import { Resource } from "@/constants/resource/resource";
import { useTractDeedData } from "@/hooks/region-overview/useTractDeedData";
import { useCardDetails } from "@/hooks/useCardDetails";
import { WorksiteType } from "@/types/planner/primitives";
import { ProductionPoints } from "@/types/productionPoints";
import {
  Alert,
  Box,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import ResourceRewardChart from "./ResourceRewardChart";
import ResourcePPChart from "./ResourcePPChart";
import PlayerTopTenTile from "../summary/PlayerTopTenTile";
import ActiveChart from "./ActiveChart";
import RegionTractSelector from "./RegionTractSelector";
import TotalActiveTile from "./TotalActiveTile";
import TaxOwnerTile from "./TaxOwnerTile";

type ZoomKey = "small" | "medium" | "large";

export default function TractAnalysisPage() {
  const [selectedRegion, setSelectedRegion] = useState<number | "">("");
  const [selectedTract, setSelectedTract] = useState<number | "">("");
  const {
    cardDetails,
    loading: cardLoading,
    error: cardError,
  } = useCardDetails();
  const { deeds, loadingText, total, progressPercentage, error, warning } =
    useTractDeedData(selectedRegion, selectedTract);

  // --- Large-screen zoom controls ---
  const theme = useTheme();
  const isLargeUp = useMediaQuery(theme.breakpoints.up("lg"));
  const [lgZoom, setLgZoom] = useState<ZoomKey>("large"); // default 100% on large screens
  const zoomMap: Record<ZoomKey, string> = {
    small: "50%",
    medium: "75%",
    large: "100%",
  };
  const handleZoomChange = (
    _: React.MouseEvent<HTMLElement>,
    value: ZoomKey | null,
  ) => {
    if (value) setLgZoom(value);
  };
  // ------

  const handleRegionChange = (value: number) => {
    setSelectedRegion(value);
    setSelectedTract(""); // Reset tract when region changes
  };

  const handleTractChange = (value: number) => {
    setSelectedTract(value);
  };

  if (cardLoading) {
    return <LoadingComponent title="Loading card details..." />;
  }

  if (cardError || error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {cardError || error}
      </Alert>
    );
  }

  type AccumulatedData = {
    totalActive: number;
    totalInactive: number;
    players: Record<string, number>;
    playersActive: Record<string, { active: number; inactive: number }>;
    tax_type: WorksiteType;
    tax_owner: string;
    rewardsPerHour: Record<Resource, number>;
    production: Record<Resource, ProductionPoints>;
  };

  const tractData = deeds?.reduce(
    (acc, deed) => {
      const player = deed.player ?? "Unknown";
      const worksiteType = deed.worksite_type as WorksiteType;
      const resource = deed.worksiteDetail?.token_symbol as Resource;
      const rewardsPerHour = deed.worksiteDetail?.rewards_per_hour ?? 0;
      const basePP = deed.stakingDetail?.total_base_pp_after_cap ?? 0;
      const boostedPP = deed.stakingDetail?.total_harvest_pp ?? 0;

      acc.players[player] = (acc.players[player] || 0) + 1;
      acc.playersActive[player] = {
        active: (acc.playersActive[player]?.active || 0) + (basePP > 0 ? 1 : 0),
        inactive:
          (acc.playersActive[player]?.inactive || 0) + (basePP === 0 ? 1 : 0),
      };

      if (basePP > 0) {
        acc.totalActive += 1;
      } else {
        acc.totalInactive += 1;
      }

      if (deed.worksiteDetail?.token_symbol === "TAX") {
        acc.tax_type = worksiteType;
        acc.tax_owner = player;
      }

      // Accumulate rewards per hour
      if (rewardsPerHour && resource && rewardsPerHour > 0) {
        acc.rewardsPerHour[resource] =
          (acc.rewardsPerHour[resource] || 0) + rewardsPerHour;
      }

      // Accumulate PP
      if (basePP && resource) {
        acc.production[resource] = {
          basePP: (acc.production[resource]?.basePP || 0) + basePP,
          boostedPP: (acc.production[resource]?.boostedPP || 0) + boostedPP,
        };
      }

      return acc;
    },
    {
      totalActive: 0,
      totalInactive: 0,
      players: {},
      playersActive: {},
      tax_type: "",
      tax_owner: "",
      rewardsPerHour: {},
      production: {},
    } as AccumulatedData,
  );

  return (
    <>
      <RegionTractSelector
        selectedRegion={selectedRegion}
        selectedTract={selectedTract}
        onRegionChange={handleRegionChange}
        onTractChange={handleTractChange}
      />

      {loadingText ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">{loadingText}</Typography>
          {total > 0 && (
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      ) : warning ? (
        <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
          {warning}
        </Alert>
      ) : (
        <>
          {tractData && (
            <Box sx={{ mb: 2 }}>
              <Box
                display={"flex"}
                gap={2}
                flexDirection={{ xs: "column", sm: "row" }}
                mb={2}
              >
                <PlayerTopTenTile players={tractData.players} />
                <TotalActiveTile
                  totalActive={tractData.totalActive}
                  totalInactive={tractData.totalInactive}
                />
                <TaxOwnerTile
                  player={tractData.tax_owner}
                  worksiteType={tractData.tax_type}
                />
              </Box>
              <Box mb={2}>
                <ActiveChart playersActive={tractData.playersActive} />
              </Box>
              <Box
                display="flex"
                flexDirection={"row"}
                flexWrap="wrap"
                gap={2}
                sx={{ width: "100%" }}
              >
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <ResourcePPChart production={tractData.production} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <ResourceRewardChart
                    rewardsPerHour={tractData.rewardsPerHour}
                  />
                </Box>
              </Box>
            </Box>
          )}
          {tractData && isLargeUp && (
            <Box sx={{ display: "flex", justifyContent: "left", mb: 2 }}>
              <ToggleButtonGroup
                color="primary"
                exclusive
                value={lgZoom}
                onChange={handleZoomChange}
                aria-label="Zoom controls"
                size="small"
              >
                <ToggleButton value="small" aria-label="Small zoom">
                  Small
                </ToggleButton>
                <ToggleButton value="medium" aria-label="Medium zoom">
                  Medium
                </ToggleButton>
                <ToggleButton value="large" aria-label="Large zoom">
                  Large
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              justifyContent: "left",
            }}
          >
            {cardDetails && deeds && deeds.length > 0
              ? deeds.map((deed) => (
                  <Box
                    key={deed.plot_id}
                    sx={{
                      minWidth: 800,
                      // For xs/sm/md: keep your defaults. For lg+: use toggle selection.
                      zoom: {
                        xs: "35%",
                        sm: "65%",
                        md: "75%",
                        lg: isLargeUp ? zoomMap[lgZoom] : "80%",
                      },
                    }}
                  >
                    <LandDeedCard
                      key={deed.deed_uid}
                      deed={deed}
                      cardDetails={cardDetails!}
                      showOwnershipInfo={true}
                    />
                  </Box>
                ))
              : null}
          </Box>
        </>
      )}
    </>
  );
}
