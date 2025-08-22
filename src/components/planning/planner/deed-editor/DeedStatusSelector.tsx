"use client";
import { land_default_off_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import { PlotStatus, plotStatusOptions } from "@/types/planner";
import {
  Box,
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
  value: PlotStatus;
  onChange: (tier: PlotStatus) => void;
};

function capitalize(word: string) {
  return word ? word[0].toUpperCase() + word.slice(1) : word;
}

export function PlotStatusSelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<PlotStatus>) => {
    onChange(e.target.value as PlotStatus);
  };

  const renderIcon = (tier: PlotStatus, size = 24) => {
    const icon = land_default_off_icon_url_placeholder.replace(
      "__NAME__",
      tier.toLowerCase(),
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
        <InputLabel>Status:</InputLabel>
        <Select<PlotStatus>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as PlotStatus) ?? value;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {renderIcon(v)}
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {capitalize(v)}
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
          {plotStatusOptions.map((rarity) => (
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
