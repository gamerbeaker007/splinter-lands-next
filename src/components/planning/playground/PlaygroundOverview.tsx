"use client";

import { PlaygroundDeed } from "@/types/playground";
import { Box, Paper, Typography } from "@mui/material";

type PlaygroundOverviewProps = {
  deeds: PlaygroundDeed[];
};

export default function PlaygroundOverview({ deeds }: PlaygroundOverviewProps) {
  // Calculate totals
  const totalDeeds = deeds.length;

  const totalBasePP = deeds.reduce((sum, deed) => {
    return sum + deed.basePP;
  }, 0);

  const totalBoostedPP = deeds.reduce((sum, deed) => {
    return sum + deed.boostedPP;
  }, 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h5" gutterBottom>
        Total Overview
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 2,
          mt: 2,
        }}
      >
        <Box>
          <Typography variant="body2" color="text.secondary">
            Total Deeds
          </Typography>
          <Typography variant="h6">{totalDeeds}</Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Total Base PP
          </Typography>
          <Typography variant="h6">{fmt(totalBasePP)}</Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Total Boosted PP
          </Typography>
          <Typography variant="h6" color="primary.main">
            {fmt(totalBoostedPP)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
