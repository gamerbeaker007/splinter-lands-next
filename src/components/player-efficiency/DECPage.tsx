import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { Box } from "@mui/material";
import RatioRankPlot from "./RatioRankPlot";
import DECEarningCharts from "@/components/player-efficiency/DECEarningCharts";

type Props = {
  currentPlayer?: string;
  playerSummaryData?: PlayerProductionSummaryEnriched[] | null;
};

export default function DECPage({ currentPlayer, playerSummaryData }: Props) {
  if (!playerSummaryData) {
    return <Box>... Loading Data</Box>;
  }

  return (
    <Box display="flex" flexDirection="column" gap={2} mb={2}>
      <DECEarningCharts
        data={playerSummaryData}
        currentPlayer={currentPlayer}
      />

      <RatioRankPlot
        data={playerSummaryData}
        currentPlayer={currentPlayer}
        xColumn="count"
        yColumn="total_dec"
        hoverLabel="Count"
        title="Total DEC earned vs amount of plots (PP as bubble size)"
        xAxisTitle="Amount of Plots"
        yAxisTitle="DEC /hr"
      />
    </Box>
  );
}
