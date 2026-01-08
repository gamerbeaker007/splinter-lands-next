"use client";

import { land_default_element_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import { TERRAIN_BONUS } from "@/types/planner";
import { Box, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import { COLUMN_WIDTHS } from "../util/gridConstants";

type TerrainBoostsColumnProps = {
  deedType: string | null;
};

export default function TerrainBoostsColumn({
  deedType,
}: TerrainBoostsColumnProps) {
  const deedTypeLower = deedType?.toLowerCase() as keyof typeof TERRAIN_BONUS;

  if (!deedTypeLower || !TERRAIN_BONUS[deedTypeLower]) {
    return (
      <Box width={COLUMN_WIDTHS.LARGE_MINUS} flexShrink={0}>
        <Typography variant="body2">-</Typography>
      </Box>
    );
  }

  const boosts = TERRAIN_BONUS[deedTypeLower];

  return (
    <Box width={COLUMN_WIDTHS.LARGE_MINUS} flexShrink={0}>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        {Object.entries(boosts).map(([element, boost]) => {
          if (boost === undefined || boost <= 0) return null;

          const icon = land_default_element_icon_url_placeholder.replace(
            "__NAME__",
            element.toLowerCase()
          );
          const percentage = `+${(boost * 100).toFixed(0)}%`;

          return (
            <Tooltip key={element} title={`${element}: ${percentage}`}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.25,
                }}
              >
                <Image
                  src={icon}
                  alt={element}
                  width={16}
                  height={16}
                  style={{
                    objectFit: "contain",
                    width: "auto",
                    height: "auto",
                  }}
                />
                <Typography variant="caption" fontSize="0.65rem">
                  {percentage}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}
