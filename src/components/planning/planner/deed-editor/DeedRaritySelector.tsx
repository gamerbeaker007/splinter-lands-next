"use client";
import { land_default_off_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import {
  PlotRarity,
  plotRarityModifiers,
  plotRarityOptions,
} from "@/types/planner";
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
  value: PlotRarity;
  onChange: (tier: PlotRarity) => void;
};

export function PlotRaritySelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<PlotRarity>) => {
    onChange(e.target.value as PlotRarity);
  };

  const renderIcon = (tier: PlotRarity, size = 24) => {
    const rarity = tier == "mythic" ? "legendary" : tier;
    const icon = land_default_off_icon_url_placeholder.replace(
      "__NAME__",
      rarity.toLowerCase(),
    );
    return (
      <Image
        src={icon}
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
        <InputLabel>Rarity:</InputLabel>
        <Select<PlotRarity>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as PlotRarity) ?? value;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {renderIcon(v)}
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {capitalize(v)} ({plotRarityModifiers[v] * 100}%)
                </Typography>
              </Box>
            );
          }}
          MenuProps={{ MenuListProps: { dense: true } }}
          sx={{
            bgcolor: "rgba(255,255,255,0.06)",
            ".MuiOutlinedInput-notchedOutline": { border: "none" },
          }}
        >
          {plotRarityOptions.map((rarity) => (
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
                  {capitalize(rarity)} ({plotRarityModifiers[rarity] * 100}%)
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
