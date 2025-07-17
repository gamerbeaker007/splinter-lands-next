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
      <Alert
        severity="info"
        sx={{
          whiteSpace: "pre-line",
          borderRadius: 2,
          fontSize: "0.9rem",
        }}
      >
        Land DEC Efficiency (LDE ratio) = log10(DEC earned per hour / Total DEC
        Staked in Use)
        {"\n"}
        LDE Score = Normalized ratio (from 0 to 100)
      </Alert>

      <RatioRankPlot
        data={playerSummaryData}
        currentPlayer={currentPlayer}
        xColumn="LDE_score"
        yColumn="LDE_rank"
        hoverLabel="LDE Score"
        title="LDE Score vs Rank"
        xAxisTitle="LDE Score"
        yAxisTitle="Rank"
      />
    </Box>
  );
}
