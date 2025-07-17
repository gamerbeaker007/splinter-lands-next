import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { Alert, Box } from "@mui/material";
import RatioRankPlot from "./RatioRankPlot";

type Props = {
  currentPlayer?: string;
  playerSummaryData?: PlayerProductionSummaryEnriched[] | null;
};

export default function LPEPage({ currentPlayer, playerSummaryData }: Props) {
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
        Land Plot Efficiency (LPE ratio) = Total DEC earned per hour / Number of
        Active Plots
        {"\n"}
        LPE Score = Normalized ratio (from 0 to 100)
      </Alert>
      <RatioRankPlot
        data={playerSummaryData}
        currentPlayer={currentPlayer}
        xColumn="LPE_ratio"
        yColumn="LPE_rank"
        hoverLabel="LPE Ratio"
        title="LPE Score vs Rank"
        xAxisTitle="LPE Score"
        yAxisTitle="Rank"
      />
    </Box>
  );
}
