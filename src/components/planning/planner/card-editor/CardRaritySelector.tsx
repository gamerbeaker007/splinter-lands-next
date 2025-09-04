"use client";
import { cardIconMap, CardRarity, cardRarityOptions } from "@/types/planner";
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
import Image from "next/image";

export type Props = {
  value: CardRarity;
  onChange: (tier: CardRarity) => void;
};

export function CardRaritySelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<CardRarity>) => {
    onChange(e.target.value as CardRarity);
  };

  const renderIcon = (tier: CardRarity, size = 24) => {
    return (
      <Image
        src={cardIconMap[tier]}
        alt={`${tier} element`}
        width={size}
        height={size}
        style={{ display: "block" }}
      />
    );
  };

  return (
    <Box borderRadius={1}>
      <FormControl size="small" variant="outlined">
        <InputLabel sx={{ color: "common.white" }}>Rarity:</InputLabel>
        <Select<CardRarity>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as CardRarity) ?? value;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {renderIcon(v)}
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
          {cardRarityOptions.map((rarity) => (
            <MenuItem key={rarity} value={rarity}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {renderIcon(rarity, 18)}
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
                  {capitalize(rarity)}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
