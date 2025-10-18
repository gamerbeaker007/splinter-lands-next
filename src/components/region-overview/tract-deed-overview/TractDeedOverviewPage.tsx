"use client";

import { LandDeedCard } from "@/components/player-overview/deed-overview/land-deed-card/LandDeedCard";
import LoadingComponent from "@/components/ui/LoadingComponent";
import { useTractDeedData } from "@/hooks/region-overview/useTractDeedData";
import { useCardDetails } from "@/hooks/useCardDetails";
import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";

type ZoomKey = "small" | "medium" | "large";

export default function TractDeedOverviewPage() {
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
  return (
    <>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Region</InputLabel>
          <Select
            value={selectedRegion}
            label="Region"
            onChange={(e) => handleRegionChange(e.target.value as number)}
          >
            {Array.from({ length: 150 }, (_, i) => i + 1).map((region) => (
              <MenuItem key={region} value={region}>
                {region}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }} disabled={!selectedRegion}>
          <InputLabel>Tract</InputLabel>
          <Select
            value={selectedTract}
            label="Tract"
            onChange={(e) => setSelectedTract(e.target.value as number)}
          >
            {Array.from({ length: 100 }, (_, i) => i + 1).map((tract) => (
              <MenuItem key={tract} value={tract}>
                {tract}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

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
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <>
          {isLargeUp && (
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
