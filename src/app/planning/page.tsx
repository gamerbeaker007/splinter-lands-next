"use client";
import { AddDeedPlanningTile } from "@/components/planning/AddDeedPlanningTile";
import { DeedPlanning } from "@/components/planning/DeedPlanning";
import { SimulationResult } from "@/components/planning/SimulationResult";
import { useCardDetails } from "@/hooks/useCardDetails";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { ProductionInfo, ResourceWithDEC } from "@/types/productionInfo";
import { Box, Container, Stack } from "@mui/material";
import React, { useEffect } from "react";

const emptyPlan: ResourceWithDEC = {
  resource: "GRAIN",
  amount: 0,
  buyPriceDEC: 0,
  sellPriceDEC: 0,
};
export default function RegionOverviewPage() {
  const { setTitle } = usePageTitle();
  const { cardDetails, loading, error, refetch } = useCardDetails();

  useEffect(() => {
    setTitle("Land Planning");
  }, [setTitle]);

  const [plans, setPlans] = React.useState<ProductionInfo[]>([
    {
      consume: [],
      produce: emptyPlan,
      netDEC: 0,
    },
  ]);

  const handlePlanChange = React.useCallback(
    (index: number, info: ProductionInfo) => {
      setPlans((prev) => {
        const next = [...prev];
        next[index] = info;
        return next;
      });
    },
    [],
  );

  const addPlan = React.useCallback(() => {
    setPlans((prev) => [
      ...prev,
      { consume: [], produce: emptyPlan, netDEC: 0 },
    ]);
  }, []);

  const deletePlan = React.useCallback((index: number) => {
    setPlans((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <Stack spacing={3}>
        {/* Top: Result, full width */}
        <SimulationResult items={plans} />

        {/* Bottom: DeedPlanning tiles + Add tile */}
        <Box display={"flex"} flexWrap={"wrap"} gap={1}>
          {plans.map((_, idx) => (
            <Box key={idx}>
              <DeedPlanning
                index={idx}
                cardDetails={cardDetails}
                onChange={handlePlanChange}
                onDelete={deletePlan}
                deletable={idx !== 0} // only allow delete for non-first
              />
            </Box>
          ))}
          <Box width={840} height={422}>
            <AddDeedPlanningTile onAdd={addPlan} />
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}
