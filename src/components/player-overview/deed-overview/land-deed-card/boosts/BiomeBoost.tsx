import React, { JSX } from "react";
import { Box, Typography, Avatar, Stack } from "@mui/material";
import { biomeColorMap, biomeIconMap, BiomeKey } from "@/lib/shared/biomeUtils";

export type BiomeBoostsProps = {
  modifiers: Partial<Record<BiomeKey, number>>;
};

export const BiomeBoosts: React.FC<BiomeBoostsProps> = ({ modifiers }) => {
  const positives: JSX.Element[] = [];
  const negatives: JSX.Element[] = [];

  Object.entries(biomeColorMap).forEach(([biome, bgColor]) => {
    const modifier = modifiers[biome as BiomeKey] || 0;
    if (modifier !== 0) {
      const percent = modifier * 100;
      const isPositive = percent > 0;
      const biomeImage = biomeIconMap[biome as BiomeKey] || "";

      const block = (
        <Box key={biome} textAlign="center">
          <Typography
            fontWeight="bold"
            fontFamily="monospace"
            fontSize="14px"
            color={isPositive ? "green" : "red"}
          >
            {percent > 0 ? `+${percent.toFixed(0)}%` : `${percent.toFixed(0)}%`}
          </Typography>
          <Avatar
            src={biomeImage}
            variant="square"
            sx={{
              height: 20,
              width: 20,
              mx: "auto",
              border: "1px solid white",
              bgcolor: bgColor,
            }}
          />
        </Box>
      );

      if (isPositive) {
        positives.push(block);
      } else {
        negatives.push(block);
      }
    }
  });

  return (
    <Box>
      {positives.length > 0 && (
        <Stack direction="row" justifyContent="center" spacing={1}>
          {positives}
        </Stack>
      )}
      {negatives.length > 0 && (
        <Stack
          direction="row"
          justifyContent="center"
          spacing={1}
          mt={0.5}
          mb={1}
        >
          {negatives}
        </Stack>
      )}
    </Box>
  );
};
