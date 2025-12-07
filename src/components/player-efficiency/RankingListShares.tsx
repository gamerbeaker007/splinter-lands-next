"use client";

import React from "react";
import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { RankedItemBox } from "@/components/region-overview/RankedItemBox";
import { Box } from "@mui/system";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";

type Props = {
  players: PlayerProductionSummaryEnriched[];
  currentPlayer?: string;
};

export default function RankingListShares({ players, currentPlayer }: Props) {
  const totalBasePPInclEfficiency = players.reduce(
    (acc, player) => acc + (player.total_land_base_pp_incl_efficiency ?? 0),
    0
  );

  const sorted = [...players]
    .filter((p) => typeof p.total_land_base_pp_incl_efficiency === "number")
    .sort(
      (a, b) =>
        b.total_land_base_pp_incl_efficiency! -
        a.total_land_base_pp_incl_efficiency!
    )
    .map((p, index) => ({
      player: p.player,
      share: p.total_land_base_pp_incl_efficiency! / totalBasePPInclEfficiency,
      rank: index + 1,
    }));

  const totalShare = sorted.reduce((sum, item) => sum + item.share, 0);
  if (Math.abs(totalShare - 1.0) > 0.01) {
    console.warn(
      `Total share is ${(totalShare * 100).toFixed(2)}%, expected 100%`
    );
  }

  const currentPlayerData = currentPlayer
    ? sorted.find((p) => p.player === currentPlayer)
    : null;

  return (
    <Box minWidth={300} maxHeight={500}>
      <Card sx={{ height: "100%", overflowY: "auto" }}>
        <Box
          sx={{
            position: "sticky",
            top: 0,
            backgroundColor: "background.paper",
            zIndex: 1,
            px: 2,
            py: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h5">Player Shares (%)</Typography>
          {currentPlayerData && (
            <Box px={1}>
              <Typography variant="body2" color="secondary.main" fontSize={14}>
                {currentPlayer} rank: {currentPlayerData.rank}
              </Typography>
              <Box display={"flex"} flexWrap={"wrap"} alignItems={"center"}>
                <Typography
                  variant="body2"
                  fontSize={12}
                  alignItems="center"
                  justifyItems={"center"}
                >
                  Value:{" "}
                  {((currentPlayerData.share * 100) as number)?.toFixed(3)} %
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {sorted.slice(0, 200).map((p) => (
          <RankedItemBox
            key={`ranked-box-${p.player}`}
            rank={p.rank as number}
            value={((p.share ?? 0) * 100).toFixed(3)}
            subValue={p.player}
          />
        ))}
      </Card>
    </Box>
  );
}
