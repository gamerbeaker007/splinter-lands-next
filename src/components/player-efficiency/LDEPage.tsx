import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { Alert, Box } from "@mui/material";
import RatioRankPlot from "./RatioRankPlot";

type Props = {
  currentPlayer?: string;
  playerSummaryData?: PlayerProductionSummaryEnriched[] | null;
};

export default function LDEPage({ currentPlayer, playerSummaryData }: Props) {
  if (!playerSummaryData) {
    return <Box>... Loading Data</Box>;
  }

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Alert severity="info">
        Land DEC Efficiency (LDE) = Total DEC Staked in Use / (DEC earned per
        hour * 24)
      </Alert>
      <RatioRankPlot
        data={playerSummaryData}
        currentPlayer={currentPlayer}
        xColumn="LDE_ratio"
        yColumn="LDE_rank"
        hoverLabel="LDE Ratio"
        title="LDE Ratio vs Rank"
        xAxisTitle="Boosted Ratio"
        yAxisTitle="Rank"
      />
    </Box>
  );
}
