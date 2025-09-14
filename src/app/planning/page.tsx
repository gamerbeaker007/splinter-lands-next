"use client";
import { AddDeedPlanningTile } from "@/components/planning/AddDeedPlanningTile";
import { DeedPlanning } from "@/components/planning/DeedPlanning";
import { SimulationResult } from "@/components/planning/SimulationResult";
import { useCardDetails } from "@/hooks/useCardDetails";
import { useFetchSPSRatio } from "@/hooks/useFetchSPSRatio";
import { useMarketData } from "@/hooks/useMarketData";
import { usePrices } from "@/hooks/usePrices";
import { useRegionTaxInfo } from "@/hooks/useRegionTax";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { ProductionInfo } from "@/types/productionInfo";
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

export default function PlanningPage() {
  const { setTitle } = usePageTitle();
  const { cardDetails, loading, error } = useCardDetails();
  const { prices, loading: loadingPrices, error: errorPrices } = usePrices();
  const {
    spsRatio,
    loading: loadingSPSRatio,
    error: errorSPSRatio,
  } = useFetchSPSRatio();
  const { regionTax } = useRegionTaxInfo();
  const { marketData } = useMarketData();
  const { prices: tokenPriceData } = useTokenPrices();

  useEffect(() => {
    setTitle("Land Planning");
  }, [setTitle]);

  const [plans, setPlans] = useState<ProductionInfo[]>([
    {
      consume: [],
      produce: [],
      netDEC: 0,
      resource: "GRAIN",
    },
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
      { resource: "GRAIN", consume: [], produce: [], netDEC: 0 },
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

  if (loading || loadingPrices || loadingSPSRatio) {
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
            Loading data (card details/ prices / sps ratio)…
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (error || errorPrices || errorSPSRatio) {
    return (
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Stack spacing={3}>
          <Alert severity="error">
            Failed to load card details or prices or sps ratio: {String(error)}
          </Alert>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 8 } }}>
      <Stack spacing={3} mt={2}>
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
        {prices && cardDetails && spsRatio && (
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
                  spsRatio={spsRatio}
                  tokenPriceData={tokenPriceData}
                  regionTax={regionTax}
                  marketData={marketData}
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
            >
              <AddDeedPlanningTile onAdd={addPlan} />
            </Box>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
