import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import RankingList from "@/components/player-efficiency/RankingList";
import { Box } from "@mui/material";

type Props = {
  currentPlayer?: string;
  playerSummaryData?: PlayerProductionSummaryEnriched[] | null;
};

export default function RankingPage({
  currentPlayer,
  playerSummaryData,
}: Props) {
  return (
    <Box display={"flex"} flexWrap={"wrap"} gap={2}>
      {playerSummaryData ? (
        <>
          <RankingList
            title="Total DEC/hr"
            players={playerSummaryData}
            rankingField="total_dec_rank"
            valueField="total_dec"
            currentPlayer={currentPlayer}
          />

          <RankingList
            title="Plots Owned"
            players={playerSummaryData}
            rankingField="count_rank"
            valueField="count"
            currentPlayer={currentPlayer}
          />

          <RankingList
            title="Boosted PP"
            players={playerSummaryData}
            rankingField="total_harvest_pp_rank"
            valueField="total_harvest_pp"
            currentPlayer={currentPlayer}
          />

          <RankingList
            title="DEC staked"
            players={playerSummaryData}
            rankingField="total_dec_staked_rank"
            valueField="total_dec_staked"
            currentPlayer={currentPlayer}
          />

          <RankingList
            title="LDE"
            players={playerSummaryData}
            rankingField="LDE_rank"
            valueField="LDE_ratio"
            currentPlayer={currentPlayer}
          />

          <RankingList
            title="LPE"
            players={playerSummaryData}
            rankingField="LPE_rank"
            valueField="LPE_ratio"
            currentPlayer={currentPlayer}
          />
        </>
      ) : (
        <Box>... Loading Data</Box>
      )}
    </Box>
  );
}
