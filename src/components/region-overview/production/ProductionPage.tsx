"use client";

import Container from "@mui/material/Container";
import { useEffect, useState } from "react";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RegionPP } from "@/types/regionProductionSummary";
import { ProductionOverviewPage } from "@/components/region-overview/production/ProductionOverview";

export function ProductionPage() {
  const [data, setData] = useState<RegionPP | null>(null);

  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    fetch("/api/region/production", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    })
      .then((res) => res.json())
      .then((raw) => {
        setData(raw);
      })
      .catch(console.error);
  }, [filters]);

  return (
    <>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        {data && <ProductionOverviewPage data={data} />}
      </Container>
    </>
  );
}
