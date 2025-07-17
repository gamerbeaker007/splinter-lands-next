import { PlayerProductionSummaryEnriched } from "@/types/PlayerProductionSummaryEnriched";
import { Alert, Box } from "@mui/material";
import RatioRankPlot from "./RatioRankPlot";

type Props = {
  currentPlayer?: string;
  playerSummaryData?: PlayerProductionSummaryEnriched[] | null;
};

export default function LCEPage({ currentPlayer, playerSummaryData }: Props) {
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
        Land Card Efficiency (LCE ratio) = log10(DEC earned per hour / Total PP
        Employed (RAW PP))
        {"\n"}
        Land Card Efficiency (LCE ratio) = log10(DEC earned per hour / Total PP
        Employed (Boosted PP))
        {"\n"}
        LCE Score = Normalized ratio (from 0 to 100)
      </Alert>
      <RatioRankPlot
        data={playerSummaryData}
        currentPlayer={currentPlayer}
        xColumn="LCE_base_score"
        yColumn="LCE_base_rank"
        hoverLabel="LCE Score"
        title="LCE Score vs Rank"
        xAxisTitle="RAW Score"
        yAxisTitle="Rank"
      />
      <RatioRankPlot
        data={playerSummaryData}
        currentPlayer={currentPlayer}
        xColumn="LCE_boosted_score"
        yColumn="LCE_boosted_rank"
        hoverLabel="LCE Score"
        title="LCE Score vs Rank"
        xAxisTitle="BOOSTED Score"
        yAxisTitle="Rank"
      />
    </Box>
  );
}
