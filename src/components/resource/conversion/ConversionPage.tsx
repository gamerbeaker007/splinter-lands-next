"use client";

import { Box } from "@mui/material";
import { ResourceCalculator } from "./calculator/ResourceCalculator";
import { ResourceFactorSection } from "./factor/ResourceFactorSection";

export function ConversionPage() {
  return (
    <Box mt={2} mb={4}>
      <ResourceCalculator />
      <ResourceFactorSection />
    </Box>
  );
}
