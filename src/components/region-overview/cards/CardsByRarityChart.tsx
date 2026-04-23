"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { LandCardSetSummary } from "@/lib/backend/actions/region/land-card-collection-actions";
import { cardFoilOptions, cardRarityOptions } from "@/types/planner";
import { Box, Typography } from "@mui/material";

const FOIL_PLOT_COLORS: Record<string, string> = {
  regular: "#9e9e9e",
  gold: "#fdd835",
  "gold arcane": "#ffb300",
  black: "#607d8b",
  "black arcane": "#ba68c8",
};

export function CardsByRarityChart({
  editionSummary,
}: Readonly<{ editionSummary: LandCardSetSummary[] }>) {
  const rarityTotals: Record<string, Record<string, number>> = {};

  for (const row of editionSummary) {
    for (const [rarity, levels] of Object.entries(row.rarity_level_counts)) {
      if (!rarityTotals[rarity]) rarityTotals[rarity] = {};
      for (const foils of Object.values(levels)) {
        for (const [foilName, count] of Object.entries(foils)) {
          rarityTotals[rarity][foilName] =
            (rarityTotals[rarity][foilName] ?? 0) + (count ?? 0);
        }
      }
    }
  }

  const rarityXLabels = cardRarityOptions.filter((r) => rarityTotals[r]);

  if (rarityXLabels.length === 0) return null;

  const traces: Partial<Plotly.PlotData>[] = cardFoilOptions.map(
    (foilName) => ({
      type: "bar",
      name: foilName,
      x: rarityXLabels,
      y: rarityXLabels.map((r) => rarityTotals[r][foilName] ?? 0),
      marker: { color: FOIL_PLOT_COLORS[foilName] },
    })
  );

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Cards by Rarity
      </Typography>
      <FullscreenPlotWrapper
        data={traces}
        layout={{
          barmode: "stack",
          showlegend: true,
          legend: { orientation: "h", y: -0.3 },
          margin: { t: 20, l: 50, r: 20, b: 80 },
        }}
        style={{ width: "100%", height: "300px" }}
      />
    </Box>
  );
}
