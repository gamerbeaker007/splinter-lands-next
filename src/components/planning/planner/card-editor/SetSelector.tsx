"use client";
import {
  CardElement,
  cardSetModifiers,
  CardSetName,
  cardSetOptions,
} from "@/types/planner";
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
  value: CardSetName;
  onChange: (tier: CardElement) => void;
};

export function SetSelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<CardSetName>) => {
    onChange(e.target.value as CardSetName);
  };

  const renderIcon = (tier: CardSetName, size = 24) => {
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
    <Box borderRadius={1} minWidth={95}>
      <FormControl size="small" variant="outlined" fullWidth>
        <InputLabel sx={{ color: fontColor }}>Set:</InputLabel>
        <Select<CardSetName>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as CardSetName) ?? value;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {renderIcon(v)}
                <Typography fontSize={14} fontWeight={600}>
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
          {cardSetOptions.map((setName) => (
            <MenuItem key={setName} value={setName}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {renderIcon(setName, 18)}
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
                  {`${capitalize(setName)} (${cardSetModifiers[setName]}x)`}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
