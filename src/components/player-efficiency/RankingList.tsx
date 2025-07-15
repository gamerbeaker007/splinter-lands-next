"use client";

import React from "react";
import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { RankedItemBox } from "@/components/region-overview/RankedItemBox";
import { formatNumberWithSuffix } from "@/lib/formatters";
import { Box } from "@mui/system";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";

type valueField =
  | "total_dec"
  | "count"
  | "LDE_ratio"
  | "LDE_score"
  | "LCE_ratio_base"
  | "LCE_base_score"
  | "LCE_ratio_boosted"
  | "LCE_boosted_score"
  | "LPE_ratio"
  | "LPE_score"
  | "total_harvest_pp"
  | "total_dec_staked"
  | "total_land_score";

type rankingField =
  | "total_dec_rank"
  | "count_rank"
  | "LDE_rank"
  | "LCE_base_rank"
  | "LCE_boosted_rank"
  | "LPE_rank"
  | "total_harvest_pp_rank"
  | "total_dec_staked_rank"
  | "total_land_rank";

type Props = {
  players: PlayerProductionSummaryEnriched[];
  rankingField: rankingField;
  valueField: valueField;
  subValueField?: valueField;
  title?: string;
  currentPlayer?: string;
};

export default function RankingList({
  players,
  rankingField,
  valueField,
  title,
  currentPlayer,
  subValueField,
}: Props) {
  const sorted = [...players]
    .filter((p) => typeof p[rankingField] === "number")
    .sort((a, b) => (a[rankingField]! as number) - (b[rankingField]! as number))
    .slice(0, 200);

  const currentPlayerData = currentPlayer
    ? players.find((p) => p.player === currentPlayer)
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
          {title && <Typography variant="h5">{title}</Typography>}
          {currentPlayerData && (
            <Box px={1}>
              <Typography variant="body2" color="secondary.main" fontSize={14}>
                {currentPlayer} rank: {currentPlayerData[rankingField]}
              </Typography>
              <Box display={"flex"} flexWrap={"wrap"} alignItems={"center"}>
                <Typography
                  variant="body2"
                  fontSize={12}
                  alignItems="center"
                  justifyItems={"center"}
                >
                  Value: {(currentPlayerData[valueField] as number)?.toFixed(2)}
                </Typography>
                {subValueField && (
                  <Typography
                    variant="body2"
                    fontSize={10}
                    alignItems="center"
                    ml={0.5}
                    justifyItems={"center"}
                  >
                    ( {(currentPlayerData[subValueField] as number)?.toFixed(2)}
                    )
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {sorted.map((p) => (
          <RankedItemBox
            key={`ranked-box-${p.player}`}
            rank={p[rankingField] as number}
            value={formatNumberWithSuffix(p[valueField] as number)}
            subValue={p.player}
            otherSubValues={
              subValueField
                ? [(p[subValueField] as number).toFixed(2)]
                : undefined
            }
          />
        ))}
      </Card>
    </Box>
  );
}
