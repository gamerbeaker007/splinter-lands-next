"use client";

import { useAsyncData } from "@/hooks/useAsyncData";
import { getRegionCompare } from "@/lib/backend/actions/region/compare-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import Container from "@mui/material/Container";
import { useState } from "react";
import { ResourceSelector } from "../ResourceSelector";
import { RarityResourceCompareChart } from "./RarityResourceCompareChart";
import { ResourcePPChart } from "./ResourcePPChart";

export function ComparePage() {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const { filters } = useFilters();

  const { data } = useAsyncData(
    filters ? JSON.stringify(filters) : null,
    () => getRegionCompare(filters!),
    { errorMessage: "Failed to load region compare data" }
  );

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
