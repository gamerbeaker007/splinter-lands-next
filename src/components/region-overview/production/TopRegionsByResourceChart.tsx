"use client";

import { RegionResourcePP } from "@/types/regionProductionSummary";
import { Box, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { ResourceSelector } from "../ResourceSelector";

type Props = {
  data: Record<string, RegionResourcePP>;
};

export default function TopRegionsByResourceChart({ data }: Props) {
  const theme = useTheme();
  const textColor = theme.palette.text.primary;
  const backgroundColor = theme.palette.background.default;

  const resourceTypes = Object.keys(data).filter((r) => r !== "");

  const [selectedResource, setSelectedResource] = useState<string | null>(
    resourceTypes[0],
  );

  const handleSelect = (resource: string | null) => {
    if (!resource || resource === selectedResource) return;
    setSelectedResource(resource);
  };

  //Auto-reset when data/resourceTypes change
  useEffect(() => {
    if (!selectedResource || !resourceTypes.includes(selectedResource)) {
      setSelectedResource(resourceTypes[0] ?? null);
    }
  }, [resourceTypes, selectedResource]);

  let topRegions: string[] = [];
  let rawValues: number[] = [];
  let boostedValues: number[] = [];

  if (selectedResource && data[selectedResource]) {
    const perRegion = data[selectedResource].perRegion;

    const regionEntries = Object.entries(perRegion)
      .map(([region, pp]) => ({
        region,
        raw: pp.rawPP,
        boosted: pp.boostedPP,
      }))
      .sort((a, b) => a.boosted - b.boosted);

    topRegions = regionEntries.map((r) => r.region);
    rawValues = regionEntries.map((r) => r.raw);
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
          mt={3}
          sx={{
            border: "1px solid",
            borderColor: "secondary.main",
            borderRadius: 5,
            padding: 2,
            width: "100%",
            minHeight: "800px",
          }}
        >
          <Plot
            data={[
              {
                x: rawValues,
                y: topRegions,
                name: "Raw PP",
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
              height: 800,
              font: { color: textColor },
              plot_bgcolor: backgroundColor,
              paper_bgcolor: backgroundColor,
              margin: { l: 50, b: 50, t: 50 },
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
            config={{ displayModeBar: "hover" }}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
          />
        </Box>
      )}{" "}
    </>
  );
}
