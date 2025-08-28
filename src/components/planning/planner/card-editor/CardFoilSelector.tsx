"use client";
import { CardFoil, cardFoilModifiers, cardFoilOptions } from "@/types/planner";
import { TbCardsFilled } from "react-icons/tb";

import {
  Box,
  capitalize,
  FormControl,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";

const foilStyle: Record<
  CardFoil,
  { iconColor: string; badgeText?: string; badgeColor?: string }
> = {
  regular: { iconColor: "gray" },
  gold: { iconColor: "gold" },
  "gold arcane": { iconColor: "gold", badgeText: "GV", badgeColor: "black" },
  black: { iconColor: "black" },
  "black arcane": { iconColor: "black", badgeText: "BV", badgeColor: "white" },
};

export type Props = {
  value: CardFoil;
  onChange: (tier: CardFoil) => void;
};

export function CardFoilSelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<CardFoil>) => {
    onChange(e.target.value as CardFoil);
  };

  function renderIcon(tier: CardFoil, size = 25) {
    const { iconColor, badgeText, badgeColor } =
      foilStyle[tier] ?? foilStyle.regular;

    // scale badge font relative to icon size
    const badgeFont = Math.max(10, Math.floor(size * 0.6)); // keeps it readable when small

    return (
      <Box
        sx={{
          position: "relative",
          width: size,
          height: size,
          display: "inline-block",
          lineHeight: 0,
        }}
        aria-label={`Foil: ${tier}`}
        title={tier}
      >
        <TbCardsFilled
          size={size}
          color={iconColor}
          style={{ display: "block" }}
        />
        {badgeText && (
          <Typography
            component="span"
            sx={{
              position: "absolute",
              inset: 0, // fill the box
              display: "grid",
              placeItems: "center", // center the text
              fontSize: badgeFont,
              fontWeight: 900,
              color: badgeColor,
              letterSpacing: 0.5,
              userSelect: "none",
              // a little stroke for contrast on gold arcane badge
              textShadow:
                badgeColor === "black"
                  ? "0 0 2px rgba(255,255,255,0.9)"
                  : "0 0 2px rgba(0,0,0,0.8)",
            }}
          >
            {badgeText}
          </Typography>
        )}
      </Box>
    );
  }

  const hasMultiplier = value != "regular" && value != "gold";
  const multiplier = cardFoilModifiers[value];

  return (
    <Box borderRadius={1}>
      <FormControl size="small" variant="outlined">
        <InputLabel sx={{ color: "common.white" }}>Foil:</InputLabel>
        <Select<CardFoil>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as CardFoil) ?? value;
            return (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
                minWidth={50}
              >
                {renderIcon(v)}{" "}
                <Typography fontSize={14} fontWeight={600}>
                  {hasMultiplier && `${multiplier}x`}
                </Typography>
              </Box>
            );
          }}
          MenuProps={{ MenuListProps: { dense: true } }}
          sx={{
            bgcolor: "rgba(255,255,255,0.06)",
            color: "common.white",
            ".MuiOutlinedInput-notchedOutline": { border: "none" },
          }}
        >
          {cardFoilOptions.map((foil) => (
            <MenuItem key={foil} value={foil}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {renderIcon(foil, 18)}
              </ListItemIcon>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {capitalize(foil)} ({cardFoilModifiers[foil]}x)
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
