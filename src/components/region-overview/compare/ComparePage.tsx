"use client";

import { useFilters } from "@/lib/frontend/context/FilterContext";
import { CompareProductionPoint } from "@/types/regionCompareProduction";
import Container from "@mui/material/Container";
import { useEffect, useState } from "react";
import { ResourceSelector } from "../ResourceSelector";
import { RarityResourceCompareChart } from "./RarityResourceCompareChart";
import { ResourcePPChart } from "./ResourcePPChart";

export function ComparePage() {
  const [data, setData] = useState<CompareProductionPoint | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const { filters } = useFilters();

  useEffect(() => {
    if (!filters) return;

    fetch("/api/region/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    })
      .then((res) => res.json())
      .then((raw: CompareProductionPoint) => {
        setData(raw);
      })
      .catch(console.error);
  }, [filters]);

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      {data && (
        <>
          <ResourceSelector
            resourceTypes={Object.keys(data.perResource)}
            selectedResource={selectedResource}
            onSelect={setSelectedResource}
          />

          {
            <ResourcePPChart
              resource={selectedResource}
              method={data.method}
              data={data.perResource}
            />
          }
        </>
      )}
      <RarityResourceCompareChart />
    </Container>
  );
}
