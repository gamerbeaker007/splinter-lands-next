import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import RankingList from "@/components/player-efficiency/RankingList";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import RankingBarChart from "./RankingBarChart";

type Props = {
  currentPlayer?: string;
  playerSummaryData?: PlayerProductionSummaryEnriched[] | null;
};

export default function RankingPage({
  currentPlayer,
  playerSummaryData,
}: Props) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box display={"flex"} flexWrap={"wrap"} gap={2} mb={2}>
      {playerSummaryData ? (
        <>
          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            gap={1}
            minHeight={450}
            width={"100%"}
          >
            <RankingBarChart
              title="Plots active"
              data={playerSummaryData}
              valueField="count"
              rankField="count_rank"
              currentPlayer={currentPlayer}
            />
            <RankingBarChart
              title="DEC staked"
              data={playerSummaryData}
              valueField="total_dec_staked"
              rankField="total_dec_staked_rank"
              currentPlayer={currentPlayer}
            />
            <RankingBarChart
              title="Boosted PP"
              data={playerSummaryData}
              valueField="total_harvest_pp"
              rankField="total_harvest_pp_rank"
              currentPlayer={currentPlayer}
            />
          </Box>
          <RankingList
            title="DEC/hr"
            players={playerSummaryData}
            rankingField="total_dec_rank"
            valueField="total_dec"
            currentPlayer={currentPlayer}
          />

          <RankingList
            title="Plots active"
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
            title="LCE Boosted PP"
            players={playerSummaryData}
            rankingField="LCE_boosted_rank"
            valueField="LCE_boosted_score"
            subValueField="LCE_ratio_boosted"
            currentPlayer={currentPlayer}
          />

          <RankingList
            title="LDE"
            players={playerSummaryData}
            rankingField="LDE_rank"
            valueField="LDE_score"
            subValueField="LDE_ratio"
            currentPlayer={currentPlayer}
          />

          <RankingList
            title="LPE"
            players={playerSummaryData}
            rankingField="LPE_rank"
            valueField="LPE_score"
            subValueField="LPE_ratio"
            currentPlayer={currentPlayer}
          />
          <RankingList
            title="Land Score"
            players={playerSummaryData}
            rankingField="total_land_rank"
            valueField="total_land_score"
            currentPlayer={currentPlayer}
          />
        </>
      ) : (
        <Box>... Loading Data</Box>
      )}
    </Box>
  );
}
