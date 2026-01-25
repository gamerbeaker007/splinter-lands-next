"use client";

import {
  getProductionLeaderboard,
  ResourceLeaderboard,
} from "@/lib/backend/actions/production-leaderboard-actions";
import { useFilters } from "@/lib/frontend/context/FilterContext";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { PRODUCING_RESOURCES } from "@/lib/shared/statics";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Box,
  CircularProgress,
  FormControlLabel,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import ProductionLeaderboardColumn from "./ProductionLeaderboardColumn";

export function ProductionRankingsContent() {
  const { filters } = useFilters();
  const { selectedPlayer } = usePlayer();
  const [data, setData] = useState<ResourceLeaderboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNet, setShowNet] = useState(false);

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
      <Box display="flex" flexDirection="column" gap={2} mb={2}>
        <Typography variant="h4">Resource Production Leaderboard</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showNet}
              onChange={(e) => setShowNet(e.target.checked)}
              size="small"
            />
          }
          label={
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="body1">
                Show Net Production Ranking
              </Typography>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Net production ranking deducts each player&apos;s resource
                      consumption from their total production. This includes
                      grain consumed by all plots, as well as resources consumed
                      for research/aura and SPS production.
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                      Note: cross region resource transfers are not considered
                      in this calculation.
                    </Typography>
                  </Box>
                }
                arrow
                placement="right"
              >
                <InfoOutlinedIcon fontSize="small" sx={{ cursor: "help" }} />
              </Tooltip>
            </Box>
          }
        />
      </Box>

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
              showNet={showNet}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
