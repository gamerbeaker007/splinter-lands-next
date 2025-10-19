"use client";

import { Box } from "@mui/material";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

type Props = {
  totalActive: number;
  totalInactive: number;
};

export default function TotalActiveTile({ totalActive, totalInactive }: Props) {
  return (
    <Box display={"flex"} flexWrap={"wrap"} gap={2} mb={2}>
      <Box minWidth={250}>
        <Paper elevation={3} sx={{ p: 2, pt: 1, borderRadius: 3 }}>
          <Typography variant="h6" gutterBottom>
            Activated %:
          </Typography>
          <Typography variant="body2">
            {totalActive + totalInactive === 0
              ? "N/A"
              : ((totalActive / (totalActive + totalInactive)) * 100).toFixed(
                  2,
                )}
            %
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
