"use client";

import * as React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { ProductionInfo } from "@/types/productionInfo";

type ResultProps = {
  items: ProductionInfo[];
};

export function SimulationResult({ items }: ResultProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2, width: "100%" }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Result (debug view)
      </Typography>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1,
          bgcolor: "background.default",
          overflow: "auto",
          maxHeight: 360,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {JSON.stringify(items, null, 2)}
      </Box>
    </Paper>
  );
}
