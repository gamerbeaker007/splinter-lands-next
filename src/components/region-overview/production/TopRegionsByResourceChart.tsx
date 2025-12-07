"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { RegionResourcePP } from "@/types/regionProductionSummary";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { ResourceSelector } from "../ResourceSelector";

type Props = {
  data: Record<string, RegionResourcePP>;
};

export default function TopRegionsByResourceChart({ data }: Props) {
  const resourceTypes = Object.keys(data).filter((r) => r !== "");

  const [selectedResource, setSelectedResource] = useState<string | null>(
    resourceTypes[0]
  );

  const handleSelect = (resource: string | null) => {
    if (!resource || resource === selectedResource) return;
    setSelectedResource(resource);
  };

  //Auto-reset when data/resourceTypes change
  useEffect(() => {
    (async () => {
      if (!selectedResource || !resourceTypes.includes(selectedResource)) {
        setSelectedResource(resourceTypes[0] ?? null);
      }
    })();
  }, [resourceTypes, selectedResource]);

  let topRegions: string[] = [];
  let baseValues: number[] = [];
  let boostedValues: number[] = [];

  if (selectedResource && data[selectedResource]) {
    const perRegion = data[selectedResource].perRegion;

    const regionEntries = Object.entries(perRegion)
      .map(([region, pp]) => ({
        region,
        base: pp.basePP,
        boosted: pp.boostedPP,
      }))
      .sort((a, b) => a.boosted - b.boosted);

    topRegions = regionEntries.map((r) => r.region);
    baseValues = regionEntries.map((r) => r.base);
    boostedValues = regionEntries.map((r) => r.boosted);
  }

  return (
    <>
      <Typography mt={4} variant="h4">
        Regions by Boosted PP
      </Typography>
      <ResourceSelector
        resourceTypes={resourceTypes}
        selectedResource={selectedResource}
        onSelect={handleSelect}
      />
      {selectedResource && (
        <Box
          mt={2}
          sx={{
            width: "100%",
            height: 800,
          }}
        >
          <FullscreenPlotWrapper
            data={[
              {
                x: baseValues,
                y: topRegions,
                name: "Base PP",
                type: "bar",
                orientation: "h",
                marker: { color: "steelblue" },
              },
              {
                x: boostedValues,
                y: topRegions,
                name: "Boosted PP",
                type: "bar",
                orientation: "h",
                marker: { color: "#94a3b8" },
              },
            ]}
            layout={{
              title: { text: `${selectedResource} – Regions by Boosted PP` },
              barmode: "group",
              xaxis: {
                title: { text: "Production Points" },
              },
              yaxis: {
                title: { text: "Regions" },
                automargin: true,
                type: "category",
              },
              legend: {
                orientation: "h",
              },
            }}
          />
        </Box>
      )}
    </>
  );
}
