"use client";

import {
  getProductionLeaderboard,
  ResourceLeaderboard,
} from "@/lib/backend/actions/production-leaderboard-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { PRODUCING_RESOURCES } from "@/lib/shared/statics";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import ProductionLeaderboardColumn from "./ProductionLeaderboardColumn";

export function ProductionRankingsContent() {
  const { filters } = useFilters();
  const { selectedPlayer } = usePlayer();
  const [data, setData] = useState<ResourceLeaderboard[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await getProductionLeaderboard(filters, selectedPlayer);
        setData(result);
      } catch (error) {
        console.error("Error fetching production leaderboard:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [filters, selectedPlayer]);

  // Filter and sort leaderboards by PRODUCING_RESOURCES order
  const sortedLeaderboards = PRODUCING_RESOURCES.map((resource) =>
    data.find((lb) => lb.resource === resource)
  ).filter((lb): lb is ResourceLeaderboard => lb !== undefined);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Resource Production Leaderboard
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      )}

      {!loading && sortedLeaderboards.length === 0 && (
        <Typography>No data available.</Typography>
      )}

      {!loading && sortedLeaderboards.length > 0 && (
        <Box
          sx={{
            borderRadius: 2,
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          {sortedLeaderboards.map((leaderboard) => (
            <ProductionLeaderboardColumn
              key={leaderboard.resource}
              leaderboard={leaderboard}
              currentPlayer={selectedPlayer}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
