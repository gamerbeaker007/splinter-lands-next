"use client";
import PlayerInput from "@/components/player-overview/PlayerInput";
import { ResourceIconToggleGroup } from "@/components/resource/ResourceIconToggleGroup";
import WeeklyDataAlert from "@/components/ui/WeeklyDataAlert";
import { GroupedPlayerTradeHubPosition } from "@/lib/backend/actions/resources/trade-hub-actions";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import { PlayerPoolSummaryCard } from "./PlayerPoolSummaryCard";
import { prepareTradeHubPools } from "./poolRankings";
import { TradeHubTokenSection } from "./TradeHubTokenSection";

type Props = {
  groupedPlayerTradeHubPosition: GroupedPlayerTradeHubPosition;
};

export default function TradeHubPositionPage({
  groupedPlayerTradeHubPosition,
}: Props) {
  const { selectedPlayer } = usePlayer();
  const pools = useMemo(
    () => prepareTradeHubPools(groupedPlayerTradeHubPosition.tokens),
    [groupedPlayerTradeHubPosition.tokens]
  );
  const [selection, setSelection] = useState<string[]>([]);
  const selectedPools = selection.filter((token) =>
    pools.some((pool) => pool.token === token)
  );

  if (!groupedPlayerTradeHubPosition) {
    return (
      <Box mt={2}>
        <Typography variant="h6" color="text.secondary">
          No trade hub position data available.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack
        mt={2}
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
      >
        <Box>
          <PlayerInput />
        </Box>
        <Box sx={{ "& .MuiAlert-root": { mb: 0 } }}>
          <WeeklyDataAlert
            lastUpdated={groupedPlayerTradeHubPosition.date}
            label="Trade hub position data"
          />
        </Box>
      </Stack>

      {selectedPlayer && pools.length > 0 && (
        <Box mt={2}>
          <Typography variant="h6" gutterBottom>
            {selectedPlayer}&apos;s pool positions
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Weekly snapshot across available pools. Hover or focus a position
            for quantities. Rankings include players in the snapshot.
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {pools.map((pool) => (
              <PlayerPoolSummaryCard
                key={pool.token}
                pool={pool}
                player={selectedPlayer}
              />
            ))}
          </Box>
        </Box>
      )}

      <Box my={2}>
        <Typography variant="h6" gutterBottom>
          Pools to display
        </Typography>
        <ResourceIconToggleGroup
          label="Trade hub pools"
          options={pools.map((pool) => ({
            value: pool.token,
            resource: pool.resource,
            label: pool.token,
          }))}
          value={selectedPools}
          onChange={setSelection}
        />
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
          mt={1}
        >
          <Typography variant="body2" color="text.secondary">
            {selectedPools.length} of {pools.length} pools selected
          </Typography>
          <Button
            size="small"
            onClick={() => setSelection(pools.map((pool) => pool.token))}
          >
            Select all
          </Button>
          <Button size="small" onClick={() => setSelection([])}>
            Clear
          </Button>
        </Stack>
      </Box>
      {selectedPools.length === 0 && (
        <Typography color="text.secondary">
          Select pools to see their charts and rankings.
        </Typography>
      )}
      <Box display="flex" flexDirection={"row"} flexWrap="wrap" gap={2}>
        {pools
          .filter((pool) => selectedPools.includes(pool.token))
          .map((pool) => (
            <TradeHubTokenSection
              key={pool.token}
              token={pool.token}
              playerTradeHubPositions={pool.positions}
              rankedPositions={pool.ranked}
              currentPlayer={selectedPlayer}
            />
          ))}
      </Box>
    </>
  );
}
