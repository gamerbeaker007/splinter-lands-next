"use client";
import PlayerInput from "@/components/player-overview/PlayerInput";
import { GroupedPlayerTradeHubPosition } from "@/lib/backend/actions/resources/trade-hub-actions";
import { usePlayer } from "@/lib/frontend/context/PlayerContext";
import WeeklyDataAlert from "@/components/ui/WeeklyDataAlert";
import { Box, Typography } from "@mui/material";
import { TradeHubTokenSection } from "./TradeHubTokenSection";

type Props = {
  groupedPlayerTradeHubPosition: GroupedPlayerTradeHubPosition;
};

export default function TradeHubPositionPage({
  groupedPlayerTradeHubPosition,
}: Props) {
  const { selectedPlayer } = usePlayer();

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
      <Box mt={2}>
        <PlayerInput />
      </Box>
      <Box mt={2}>
        <WeeklyDataAlert
          lastUpdated={groupedPlayerTradeHubPosition.date}
          label="Trade hub position data"
        />
      </Box>

      <Box display="flex" flexDirection={"row"} flexWrap="wrap" gap={2}>
        {Object.entries(groupedPlayerTradeHubPosition.tokens).map(
          ([token, playerTradeHubPositions]) => (
            <TradeHubTokenSection
              key={token}
              token={token}
              playerTradeHubPositions={playerTradeHubPositions}
              currentPlayer={selectedPlayer}
            />
          )
        )}
      </Box>
    </>
  );
}
