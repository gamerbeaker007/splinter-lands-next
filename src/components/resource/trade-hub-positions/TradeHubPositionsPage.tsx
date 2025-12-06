import { groupedPlayerTradeHubPosition } from "@/app/api/resource/trade-hub/player-positions/route";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { TradeHubTokenSection } from "./TradeHubTokenSection";
import PlayerInput from "@/components/player-overview/PlayerInput";

export default function TradeHubPositionPage() {
  const [groupedPlayerTradeHubPosition, setGroupedPlayerTradeHubPosition] =
    useState<groupedPlayerTradeHubPosition | null>(null);

  const [selectedPlayer, setSelectedPlayer] = useState<string>("");

  useEffect(() => {
    fetch("/api/resource/trade-hub/player-positions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then(setGroupedPlayerTradeHubPosition)
      .catch(console.error);
  }, []);

  if (!groupedPlayerTradeHubPosition) {
    return <Box>... Loading Data</Box>;
  }

  return (
    <>
      <Box mt={2}>
        <PlayerInput onPlayerChange={setSelectedPlayer} />
      </Box>
      <Box mt={2}>
        <Typography variant="h5">
          Based on data retrieved from:{" "}
          {groupedPlayerTradeHubPosition.date
            ? new Date(groupedPlayerTradeHubPosition.date)
                .toISOString()
                .slice(0, 10)
            : ""}
        </Typography>
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
