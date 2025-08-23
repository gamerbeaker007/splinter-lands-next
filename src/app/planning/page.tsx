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
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

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
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <Stack spacing={3}>
        {/* Top: Result, full width */}
        <SimulationResult items={plans} />

        {/* Bottom: DeedPlanning tiles + Add tile */}
        {prices && cardDetails && (
          <Box display="flex" flexWrap="wrap" gap={1}>
            {plans.map((_, idx) => (
              <Box key={idx}>
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
            <Box width={840} height={422}>
              <AddDeedPlanningTile onAdd={addPlan} />
            </Box>
          </Box>
        )}
      </Stack>
    </Container>
  );
}
