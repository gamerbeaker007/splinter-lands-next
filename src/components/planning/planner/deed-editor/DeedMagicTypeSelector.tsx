"use client";
import { land_default_off_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import { MagicType, magicTypeOptions } from "@/types/planner";
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
  value: MagicType;
  onChange: (tier: MagicType) => void;
};

function capitalize(word: string) {
  return word ? word[0].toUpperCase() + word.slice(1) : word;
}

export function MagicTypeSelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<MagicType>) => {
    onChange(e.target.value as MagicType);
  };

  const renderIcon = (tier: MagicType, size = 24) => {
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
        <InputLabel>MagicType:</InputLabel>
        <Select<MagicType>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as MagicType) ?? value;
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
          {magicTypeOptions.map((v) => (
            <MenuItem key={v} value={v}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {renderIcon(v, 18)}
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
                  {capitalize(v)}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
