"use client";

import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { FullscreenPlotWrapper } from "../ui/graph/FullscreenPlotWrapper";
import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";

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
  const theme = useTheme();
  const backgroundColor = theme.palette.background.default;
  const textColor = theme.palette.text.primary;

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
          border: "1px solid",
          borderColor: "secondary.main",
          borderRadius: 5,
          padding: 2,
          width: "100%",
          minHeight: "500px",
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
            paper_bgcolor: backgroundColor,
            plot_bgcolor: backgroundColor,
            barmode: "stack",
            font: { color: textColor },
            title: { text: `Ranking by ${valueField}` },
            yaxis: {
              title: { text: `${valueField} (log)` },
              type: "log",
            },
            showlegend: false,
            margin: { t: 50, l: 50, r: 20, b: 100 },
          }}
        />
      </Box>
    </Box>
  );
}
