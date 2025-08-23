"use client";
import { CardFoil, cardFoilOptions } from "@/types/planner";
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

export type Props = {
  value: CardFoil;
  onChange: (tier: CardFoil) => void;
};

export function CardFoilSelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<CardFoil>) => {
    onChange(e.target.value as CardFoil);
  };

  const renderIcon = (tier: CardFoil, size = 24) => {
    return (
      <TbCardsFilled
        size={size}
        display={"block"}
        color={tier === "regular" ? "gray" : "yellow"}
      />
    );
  };

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
                  {capitalize(foil)}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
