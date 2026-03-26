"use client";

import { FullscreenPlotWrapper } from "@/components/ui/graph/FullscreenPlotWrapper";
import { LandCardSetSummary } from "@/lib/backend/actions/region/land-card-collection-actions";
import { landCardSet } from "@/types/editions";
import { cardRarityOptions, RarityColor } from "@/types/planner";
import { Box, Typography } from "@mui/material";

export function CardSetOverviewChart({
  editionSummary,
}: Readonly<{ editionSummary: LandCardSetSummary[] }>) {
  if (editionSummary.length === 0) return null;

  const sorted = [...editionSummary].sort((a, b) => {
    const ai = landCardSet.indexOf(a.card_set);
    const bi = landCardSet.indexOf(b.card_set);
    const aIdx = ai === -1 ? landCardSet.length : ai;
    const bIdx = bi === -1 ? landCardSet.length : bi;
    return aIdx - bIdx;
  });

  const sets = sorted.map((r) => r.card_set);

  // Per card-set, sum cards per rarity across all levels and foils
  const rarityCountsPerSet: Record<string, Record<string, number>> = {};
  for (const row of sorted) {
    rarityCountsPerSet[row.card_set] = {};
    for (const [rarity, levels] of Object.entries(row.rarity_level_counts)) {
      let total = 0;
      for (const foils of Object.values(levels)) {
        for (const count of Object.values(foils)) {
          total += count ?? 0;
        }
      }
      rarityCountsPerSet[row.card_set][rarity] = total;
    }
  }

  const rarityTraces: Partial<Plotly.PlotData>[] = cardRarityOptions.map(
    (rarity) => ({
      type: "bar",
      name: rarity.charAt(0).toUpperCase() + rarity.slice(1),
      x: sets,
      y: sets.map((s) => rarityCountsPerSet[s][rarity] ?? 0),
      marker: { color: RarityColor[rarity] },
      yaxis: "y",
    })
  );

  const ppTrace: Partial<Plotly.PlotData> = {
    type: "scatter",
    mode: "lines+markers",
    name: "Land Base PP",
    x: sets,
    y: sorted.map((r) => r.land_base_pp),
    yaxis: "y2",
    line: { color: "#ef5350", width: 2 },
    marker: { color: "#ef5350", size: 6 },
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Cards per Set by Rarity &amp; Total PP
      </Typography>
      <FullscreenPlotWrapper
        data={[...rarityTraces, ppTrace]}
        layout={{
          barmode: "stack",
          showlegend: true,
          legend: { orientation: "h", y: -0.3 },
          margin: { t: 20, l: 60, r: 60, b: 100 },
          yaxis: {
            title: { text: "Cards" },
            side: "left",
          },
          yaxis2: {
            title: { text: "Land Base PP" },
            side: "right",
            overlaying: "y",
            showgrid: false,
          },
          xaxis: {
            tickangle: -35,
          },
        }}
        style={{ width: "100%", height: "360px" }}
      />
    </Box>
  );
}
