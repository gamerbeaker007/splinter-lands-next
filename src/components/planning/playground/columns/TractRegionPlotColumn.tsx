"use client";

import { Box, Typography } from "@mui/material";
import { COLUMN_WIDTHS } from "../gridConstants";

type TractRegionPlotColumnProps = {
  regionNumber: number;
  tractNumber: number;
  plotNumber: number;
};

export default function TractRegionPlotColumn({
  regionNumber,
  tractNumber,
  plotNumber,
}: TractRegionPlotColumnProps) {
  return (
    <Box width={COLUMN_WIDTHS.MEDIUM} flexShrink={0}>
      <Typography variant="body2" fontSize="0.75rem">
        R{regionNumber} T{tractNumber} P{plotNumber}
      </Typography>
    </Box>
  );
}
