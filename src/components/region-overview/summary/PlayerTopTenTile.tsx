"use client";

import { Box, useMediaQuery, useTheme } from "@mui/material";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { RankedItemBox } from "@/components/region-overview/RankedItemBox";
import { formatNumberWithSuffix } from "@/lib/formatters";
import React from "react";

type Props = {
  players: Record<string, number>;
};

export default function PlayerTopTenTile({ players }: Props) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  const topTenPlayers = Object.entries(players)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  const uniquePlayerCount = Object.keys(players).length;

  return (
    <Box
      display={"flex"}
      flexDirection={isSmallScreen ? "column" : "row"}
      flexWrap={"wrap"}
      gap={2}
    >
      <Box minWidth={250}>
        <Paper elevation={3} sx={{ p: 2, pt: 1, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top 10 Players
          </Typography>
          {topTenPlayers.map(([player, value], idx) => (
            <RankedItemBox
              key={idx}
              rank={idx + 1}
              value={formatNumberWithSuffix(value)}
              subValue={player}
            />
          ))}
        </Paper>
      </Box>
      <Box minWidth={250}>
        <Paper elevation={3} sx={{ p: 2, pt: 1, borderRadius: 3 }}>
          <Typography variant="h6">Unique Players</Typography>
          <Typography variant="body2">{uniquePlayerCount}</Typography>
        </Paper>
      </Box>
    </Box>
  );
}
