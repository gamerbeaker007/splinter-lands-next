import React, { JSX } from "react";
import { Box, Typography, Avatar, Stack } from "@mui/material";
import {
  death_element_icon_url,
  dragon_element_icon_url,
  earth_element_icon_url,
  fire_element_icon_url,
  life_element_icon_url,
  water_element_icon_url,
} from "@/lib/shared/statics_icon_urls";

export type BiomeBoostsProps = {
  modifiers: Partial<
    Record<"red" | "blue" | "white" | "black" | "green" | "gold", number>
  >;
};

const biomeMapper: Record<string, string> = {
  red: fire_element_icon_url,
  blue: water_element_icon_url,
  white: life_element_icon_url,
  black: death_element_icon_url,
  green: earth_element_icon_url,
  gold: dragon_element_icon_url,
};

const colorMap: Record<string, string> = {
  red: "red",
  blue: "blue",
  white: "gray",
  black: "purple",
  green: "green",
  gold: "gold",
};

export const BiomeBoosts: React.FC<BiomeBoostsProps> = ({ modifiers }) => {
  const positives: JSX.Element[] = [];
  const negatives: JSX.Element[] = [];

  Object.entries(colorMap).forEach(([biome, bgColor]) => {
    const modifier = modifiers[biome as keyof typeof modifiers] || 0;
    if (modifier !== 0) {
      const percent = modifier * 100;
      const isPositive = percent > 0;
      const biomeImage = biomeMapper[biome];

      const block = (
        <Box key={biome} textAlign="center" mx={0.5}>
          <Typography
            variant="body2"
            sx={{
              color: isPositive ? "green" : "red",
              fontWeight: "bold",
              fontFamily: "monospace",
              fontSize: "10pt",
            }}
          >
            {percent > 0 ? `+${percent.toFixed(0)}%` : `${percent.toFixed(0)}%`}
          </Typography>
          <Avatar
            src={biomeImage}
            variant="square"
            sx={{
              height: 25,
              width: 25,
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
        <Stack direction="row" justifyContent="center" spacing={1} mt={1}>
          {negatives}
        </Stack>
      )}
    </Box>
  );
};
