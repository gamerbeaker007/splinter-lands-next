"use client";

import { ProductionOverviewPage } from "@/components/region-overview/production/ProductionOverview";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { RegionPP } from "@/types/regionProductionSummary";
import { useEffect, useState } from "react";
import { HistoricalProductionPP } from "./HistoricalProductionPP";

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
      {data && <ProductionOverviewPage data={data} />}
      <HistoricalProductionPP />
    </>
  );
}
