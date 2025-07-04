"use client";

import { useState } from "react";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import Plot from "react-plotly.js";
import { RegionResourcePP } from "@/types/regionProductionSummary";
import { RESOURCE_ICON_MAP } from "@/lib/shared/statics";

type Props = {
  data: Record<string, RegionResourcePP>;
};

export default function TopRegionsByResourceChart({ data }: Props) {
  const theme = useTheme();
  const textColor = theme.palette.text.primary;
  const backgroundColor = theme.palette.background.default;

  const [selectedResource, setSelectedResource] = useState<string | null>(
    "GRAIN",
  );

  const handleSelect = (resource: string) => {
    setSelectedResource(resource);
  };

  // Extract all unique resource types
  const resourceTypes = Array.from(
    new Set(
      Object.entries(data)
        .flatMap(([resource]) => resource)
        .filter((r) => r !== ""),
    ),
  );

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

      <Box display={"flex"} flexWrap={"wrap"} justifyContent={"center"}>
        <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
          {resourceTypes.map((resource) => (
            <Button
              key={resource}
              variant={selectedResource === resource ? "contained" : "outlined"}
              onClick={() => handleSelect(resource)}
              sx={{ width: 100, height: 100, padding: 1 }}
            >
              <img
                src={RESOURCE_ICON_MAP[resource]}
                alt={resource}
                style={{ maxWidth: "100%", maxHeight: "100%" }}
              />
            </Button>
          ))}
        </Stack>
      </Box>
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
      )}
    </>
  );
}
