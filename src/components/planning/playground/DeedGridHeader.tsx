"use client";

import { Box } from "@mui/material";
import { useRef } from "react";
import { COLUMN_WIDTHS } from "./util/gridConstants";

export default function DeedGridHeader() {
  const boxRef = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={boxRef}
      sx={{
        display: "flex",
        bgcolor: "action.hover",
        p: 1,
        fontWeight: "bold",
        borderBottom: 1,
        borderColor: "divider",
        fontSize: "0.75rem",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <Box width={COLUMN_WIDTHS.MEDIUM} flexShrink={0}>
        Tract/Region/Plot
      </Box>
      <Box width={COLUMN_WIDTHS.SMALL} flexShrink={0}>
        Link
      </Box>
      <Box width={COLUMN_WIDTHS.SMALL} flexShrink={0}>
        Rarity
      </Box>
      <Box width={COLUMN_WIDTHS.MEDIUM_PLUS} flexShrink={0}>
        Geography
      </Box>
      <Box width={COLUMN_WIDTHS.SMALL} flexShrink={0}>
        Status
      </Box>
      <Box width={COLUMN_WIDTHS.LARGE_MINUS} flexShrink={0}>
        Terrain Boosts
      </Box>
      <Box width={COLUMN_WIDTHS.MEDIUM_MINUS} flexShrink={0}>
        Worksite
      </Box>
      <Box width={COLUMN_WIDTHS.MEDIUM_MINUS} flexShrink={0}>
        Runi
      </Box>
      <Box width={COLUMN_WIDTHS.MEDIUM_MINUS} flexShrink={0}>
        Title
      </Box>
      <Box width={COLUMN_WIDTHS.MEDIUM_MINUS} flexShrink={0}>
        Totem
      </Box>
      <Box width={COLUMN_WIDTHS.LARGE} flexShrink={0} ml={1} mr={1}>
        Worker 1
      </Box>
      <Box width={COLUMN_WIDTHS.LARGE} flexShrink={0} ml={1} mr={1}>
        Worker 2
      </Box>
      <Box width={COLUMN_WIDTHS.LARGE} flexShrink={0} ml={1} mr={1}>
        Worker 3
      </Box>
      <Box width={COLUMN_WIDTHS.LARGE} flexShrink={0} ml={1} mr={1}>
        Worker 4
      </Box>
      <Box width={COLUMN_WIDTHS.LARGE} flexShrink={0} ml={1} mr={1}>
        Worker 5
      </Box>
      <Box width={COLUMN_WIDTHS.EXTRA_LARGE} flexShrink={0}>
        Output (Produce/Consume)
      </Box>
    </Box>
  );
}
