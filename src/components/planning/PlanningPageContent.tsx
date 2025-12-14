"use client";
import { AddDeedPlanningTile } from "@/components/planning/planner-tile/AddDeedPlanningTile";
import { DeedPlanning } from "@/components/planning/planner-tile/DeedPlanning";
import { SimulationResult } from "@/components/planning/simulation-result/SimulationResult";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { LowestMarketData } from "@/types/planner/market/market";
import { Prices, SplPriceData } from "@/types/price";
import { ProductionInfo } from "@/types/productionInfo";
import { RegionTax } from "@/types/regionTax";
import { SplCardDetails } from "@/types/splCardDetails";
import {
  Box,
  Container,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

type ZoomKey = "small" | "medium" | "large";

interface PlanningPageContentProps {
  cardDetails: SplCardDetails[];
  prices: Prices;
  spsRatio: number;
  tokenPriceData: SplPriceData | null;
  regionTax: RegionTax[] | null;
  marketData: LowestMarketData | null;
}

export default function PlanningPageContent({
  cardDetails,
  prices,
  spsRatio,
  tokenPriceData,
  regionTax,
  marketData,
}: PlanningPageContentProps) {
  const { setTitle } = usePageTitle();

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
    []
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
    value: ZoomKey | null
  ) => {
    if (value) setLgZoom(value);
  };
  // -----------------------------------

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
        {prices && cardDetails && spsRatio !== null && (
          <Box display="flex" flexWrap="wrap" gap={1}>
            {plans.map((_, idx) => (
              <Box
                key={idx}
                sx={{
                  // For xs/sm/md: keep your defaults. For lg+: use toggle selection.
                  zoom: {
                    xs: "28%",
                    sm: "55%",
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
