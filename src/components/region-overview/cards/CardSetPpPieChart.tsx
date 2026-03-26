"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { LandCardSetSummary } from "@/lib/backend/actions/region/land-card-collection-actions";
import { Box, Typography } from "@mui/material";

export function CardSetPpPieChart({
  editionSummary,
}: Readonly<{ editionSummary: LandCardSetSummary[] }>) {
  const filtered = editionSummary.filter((r) => r.land_base_pp > 0);

  if (filtered.length === 0) return null;

  const traces: Partial<Plotly.PlotData>[] = [
    {
      type: "pie",
      labels: filtered.map((r) => r.card_set),
      values: filtered.map((r) => r.land_base_pp),
      textinfo: "label+percent",
      hovertemplate:
        "%{label}<br>PP: %{value:,.0f}<br>%{percent}<extra></extra>",
    },
  ];

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Land Base PP by Card Set
      </Typography>
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          showlegend: true,
          legend: { orientation: "h", y: -0.2 },
          margin: { t: 20, l: 20, r: 20, b: 60 },
        }}
        style={{ width: "100%", height: "340px" }}
      />
    </Box>
  );
}
