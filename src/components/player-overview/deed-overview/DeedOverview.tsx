"use client";

import { useFilters } from "@/lib/frontend/context/FilterContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { DeedComplete } from "@/types/deed";
import { SplCardDetails } from "@/types/splCardDetails";
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
import { useEffect, useState } from "react";
import DeedCount from "./land-deed-card/deed-count/DeedCount";
import { LandDeedCard } from "./land-deed-card/LandDeedCard";

type ZoomKey = "small" | "medium" | "large";

export default function DeedOverview() {
  const { selectedPlayer } = usePlayer();
  const [data, setData] = useState<DeedComplete[] | null>(null);
  const [loadingText, setLoadingText] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [warning, setWarning] = useState<string | null>(null);

  //TODO use new hook useCardDetails
  const [cardDetails, setCardDetails] = useState<SplCardDetails[] | null>(null);

  const { filters } = useFilters();

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

  useEffect(() => {
    fetch("/api/card-details", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then(setCardDetails)
      .catch(console.error);
  }, [filters, selectedPlayer]);

  useEffect(() => {
    if (!filters || !selectedPlayer) return;

    const run = async () => {
      try {
        setData([]);
        setProgress(0);
        setTotal(0);
        setWarning(null);
        setLoadingText("Loading deeds...");

        const res = await fetch("/api/player", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters, player: selectedPlayer }),
        });

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const enrichedDeeds: DeedComplete[] = [];

        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.trim()) continue;
              const parsed = JSON.parse(line);

              if (parsed.type === "warning") {
                setWarning(parsed.warning);
                continue;
              }

              if (parsed.type === "deed") {
                enrichedDeeds.push(parsed.deed);
                setData([...enrichedDeeds]); // trigger re-render
                setProgress(parsed.index);
                setTotal(parsed.total);
                setLoadingText(
                  `Loading deeds... ${parsed.index} / ${parsed.total}`
                );
              }
            }
          }
        }

        setLoadingText(null);
      } catch (err) {
        console.error("Failed to load deed data", err);
        setLoadingText("An error occurred while loading deeds.");
      }
    };

    run();
  }, [filters, selectedPlayer]);

  return (
    <>
      {loadingText ? (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">{loadingText}</Typography>
          {total > 0 && (
            <LinearProgress
              variant="determinate"
              value={(progress / total) * 100}
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
