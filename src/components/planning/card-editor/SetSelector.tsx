"use client";
import { CardSetNameLandValid } from "@/types/editions";
import { CardElement, cardSetModifiers } from "@/types/planner";
import { cardSetIconMap } from "@/types/planner/primitives";
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
  value: CardSetNameLandValid;
  onChange: (tier: CardElement) => void;
};

export function SetSelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<CardSetNameLandValid>) => {
    onChange(e.target.value as CardSetNameLandValid);
  };

  const renderIcon = (tier: CardSetNameLandValid, size = 24) => {
    return (
      <Image
        src={cardSetIconMap[tier]}
        alt={`${tier} element`}
        width={size}
        height={size}
        style={{ display: "block" }}
      />
    );
  };

  const fontColor = "common.white";

  return (
    <Box borderRadius={1} minWidth={90}>
      <FormControl size="small" variant="outlined" fullWidth>
        <InputLabel sx={{ color: fontColor }}>Set:</InputLabel>
        <Select<CardSetNameLandValid>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as CardSetNameLandValid) ?? value;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {renderIcon(v)}
                <Typography variant="caption">
                  {cardSetModifiers[v]}x
                </Typography>
              </Box>
            );
          }}
          MenuProps={{ MenuListProps: { dense: true } }}
          sx={{
            bgcolor: "rgba(255,255,255,0.06)",
            color: fontColor,
            ".MuiOutlinedInput-notchedOutline": { border: "none" },
          }}
        >
          {Object.entries(cardSetModifiers).map(([setName, modifier]) => (
            <MenuItem key={setName} value={setName}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {renderIcon(setName as CardSetNameLandValid, 18)}
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
                  {`${capitalize(setName)} (${modifier}x)`}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
