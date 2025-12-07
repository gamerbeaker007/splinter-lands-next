import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { RESOURCE_COLOR_MAP } from "@/lib/shared/statics";
import { ProductionPoints } from "@/types/productionPoints";
import { Box } from "@mui/material";
import { PlotData } from "plotly.js";

type ResourcePPChartProps = {
  method: string | null;
  resource: string | null;
  data: Record<string, Record<string, ProductionPoints>>; // perResource
};

export const ResourcePPChart = ({
  method,
  resource,
  data,
}: ResourcePPChartProps) => {
  if (!data || Object.keys(data).length === 0) return null;

  const locations = new Set<string>();
  const traces: Partial<PlotData>[] = [];

  const resources = resource ? [resource] : Object.keys(data);

  if (resource) {
    const perLocation = data[resource];
    if (!perLocation) return null;
    // Sort locations by boostedPP descending
    const sortedEntries = Object.entries(perLocation).sort(
      ([, a], [, b]) => b.boostedPP - a.boostedPP
    );
    traces.push({
      type: "bar",
      name: `${resource} Boosted`,
      x: sortedEntries.map(([loc]) => loc),
      y: sortedEntries.map(([, val]) => val.boostedPP),
      marker: { color: RESOURCE_COLOR_MAP[resource] || "black" },
    });
  } else {
    for (const res of resources) {
      const perLocation = data[res];
      const color = RESOURCE_COLOR_MAP[res] || "black";
      if (!perLocation) continue;

      for (const loc of Object.keys(perLocation)) {
        locations.add(loc);
      }

      traces.push({
        type: "bar",
        name: `${res} Boosted`,
        x: Object.keys(perLocation),
        y: Object.values(perLocation).map((v) => v.boostedPP),
        marker: { color },
      });
    }
  }

  return (
    <Box
      mt={2}
      sx={{
        width: "100%",
        height: 700,
      }}
    >
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          barmode: "group",
          title: {
            text: "Production Points by Resource and Location",
          },
          xaxis: {
            title: { text: `Location (${method})` },
            tickangle: -45,
            automargin: true,
            showgrid: false,
            type: "category",
          },
          yaxis: {
            title: { text: "Production Points" },
          },
        }}
      />
    </Box>
  );
};
