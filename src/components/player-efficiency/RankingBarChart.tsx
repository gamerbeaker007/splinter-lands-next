"use client";

import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { Box, Typography } from "@mui/material";
import { FullscreenPlotWrapper } from "../ui/graph/FullscreenPlotWrapper";

type Props = {
  title: string;
  data: PlayerProductionSummaryEnriched[];
  valueField: keyof PlayerProductionSummaryEnriched;
  rankField: keyof PlayerProductionSummaryEnriched;
  currentPlayer?: string;
};

export default function RankingBarChart({
  title,
  data,
  valueField,
  rankField,
  currentPlayer,
}: Props) {
  const sorted = [...data]
    .filter((d) => d[valueField] !== undefined && d[rankField] !== undefined)
    .sort((a, b) => Number(a[rankField])! - Number(b[rankField]!));

  const players = sorted.map((d) => d.player);
  const values = sorted.map((d) => d[valueField] as number);
  const maxVal = Math.max(...values);

  const highlightY = sorted.map((d) =>
    d.player === currentPlayer ? maxVal - (d[valueField] as number) : 0,
  );

  const selectedRank = sorted.find((d) => d.player === currentPlayer)?.[
    rankField
  ];

  return (
    <Box flex={1} minWidth={0}>
      <Box justifyItems={"center"}>
        <Typography variant="h5">{title}</Typography>
        {currentPlayer && selectedRank !== undefined && (
          <Typography variant="body2" color="secondary.main" fontSize={14}>
            {currentPlayer} rank: {selectedRank} / {sorted.length}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          width: "100%",
          height: 500,
        }}
      >
        <FullscreenPlotWrapper
          data={[
            {
              type: "bar",
              x: players,
              y: values,
              marker: { color: "94a3b8" },
              name: "Value",
              hoverinfo: "x+y",
            },
            {
              type: "bar",
              x: players,
              y: highlightY,
              marker: { color: "red" },
              name: "Gap to Max",
              hoverinfo: "skip",
            },
          ]}
          layout={{
            barmode: "stack",
            title: { text: `Ranking by ${valueField}` },
            xaxis: { showgrid: false, tickangle: -45 },
            yaxis: {
              title: { text: `${valueField} (log)` },
              type: "log",
            },
            margin: { r: 20 },
            showlegend: false,
          }}
        />
      </Box>
    </Box>
  );
}
