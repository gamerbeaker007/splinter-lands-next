"use client";

import { useCardDetailsAction } from "@/hooks/action-based/useCardDetails";
import { useEnrichedPlayerDeeds } from "@/hooks/action-based/useEnrichedPlayerDeeds";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import {
  Alert,
  Box,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import DeedCount from "./land-deed-card/deed-count/DeedCount";
import { LandDeedCard } from "./land-deed-card/LandDeedCard";

type ZoomKey = "small" | "medium" | "large";

export default function DeedOverview() {
  const { selectedPlayer } = usePlayer();
  const { filters } = useFilters();

  // Use action-based hooks
  const { cardDetails } = useCardDetailsAction();
  const {
    deeds: data,
    loadingText,
    progress,
    total,
    warning,
  } = useEnrichedPlayerDeeds(selectedPlayer, filters);

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
    value: ZoomKey | null
  ) => {
    if (value) setLgZoom(value);
  };
  // -----------------------------------

  return (
    <>
      {loadingText ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">{loadingText}</Typography>
          {total > 0 && (
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      ) : (
        <>
          {/* Warning */}
          {warning && (
            <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
              {warning}
            </Alert>
          )}

          {data && data.length > 0 ? (
            <DeedCount deedCount={data?.length ?? 0} />
          ) : null}

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
              justifyContent: "center",
            }}
          >
            {cardDetails && data && data.length > 0 ? (
              data.map((deed) => (
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
                    cardDetails={cardDetails}
                  />
                </Box>
              ))
            ) : (
              <Typography>No data</Typography>
            )}
          </Box>
        </>
      )}
    </>
  );
}
