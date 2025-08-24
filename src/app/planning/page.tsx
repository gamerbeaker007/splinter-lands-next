"use client";
import { AddDeedPlanningTile } from "@/components/planning/AddDeedPlanningTile";
import { DeedPlanning } from "@/components/planning/DeedPlanning";
import { SimulationResult } from "@/components/planning/SimulationResult";
import { useCardDetails } from "@/hooks/useCardDetails";
import { usePrices } from "@/hooks/usePrices";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { ProductionInfo, ResourceWithDEC } from "@/types/productionInfo";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type ZoomKey = "small" | "medium" | "large";

const emptyPlan: ResourceWithDEC = {
  resource: "GRAIN",
  amount: 0,
  buyPriceDEC: 0,
  sellPriceDEC: 0,
};

export default function RegionOverviewPage() {
  const { setTitle } = usePageTitle();
  const { cardDetails, loading, error } = useCardDetails();
  const { prices, loading: loadingPrices, error: errorPrices } = usePrices();

  useEffect(() => {
    setTitle("Land Planning");
  }, [setTitle]);

  const [plans, setPlans] = useState<ProductionInfo[]>([
    { consume: [], produce: emptyPlan, netDEC: 0 },
  ]);

  const handlePlanChange = useCallback(
    (index: number, info: ProductionInfo) => {
      setPlans((prev) => {
        const next = [...prev];
        next[index] = info;
        return next;
      });
    },
    [],
  );

  const addPlan = useCallback(() => {
    setPlans((prev) => [
      ...prev,
      { consume: [], produce: emptyPlan, netDEC: 0 },
    ]);
  }, []);

  const deletePlan = useCallback((index: number) => {
    setPlans((prev) => prev.filter((_, i) => i !== index));
  }, []);

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
  // -----------------------------------

  // Loading state
  if (loading || loadingPrices) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Stack
          spacing={3}
          alignItems="center"
          justifyContent="center"
          minHeight="40vh"
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Loading card details…
          </Typography>
        </Stack>
      </Container>
    );
  }

  // Error state
  if (error || errorPrices) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Stack spacing={3}>
          <Alert severity="error">
            Failed to load card details or prices: {String(error)}
          </Alert>
        </Stack>
      </Container>
    );
  }

  // Data ready
  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 8 } }}>
      <Stack spacing={3}>
        {/* Top: Result, full width */}
        <SimulationResult items={plans} />

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

        {/* Bottom: DeedPlanning tiles + Add tile */}
        {prices && cardDetails && (
          <Box display="flex" flexWrap="wrap" gap={1}>
            {plans.map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  // For xs/sm/md: keep your defaults. For lg+: use toggle selection.
                  zoom: {
                    xs: "30%",
                    sm: "60%",
                    md: "75%",
                    lg: isLargeUp ? zoomMap[lgZoom] : "80%",
                  },
                }}
              >
                <DeedPlanning
                  index={idx}
                  cardDetails={cardDetails}
                  prices={prices}
                  onChange={handlePlanChange}
                  onDelete={deletePlan}
                  deletable={idx !== 0}
                />
              </Box>
            ))}
            <Box
              sx={{
                // For xs/sm/md: keep your defaults. For lg+: use toggle selection.
                zoom: {
                  xs: "31%",
                  sm: "61%",
                  md: "75%",
                  lg: isLargeUp ? zoomMap[lgZoom] : "80%",
                },
              }}
              width={980}
              height={422}
            >
              <AddDeedPlanningTile onAdd={addPlan} />
            </Box>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
