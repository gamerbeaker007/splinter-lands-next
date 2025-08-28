"use client";
import {
  land_common_totem_icon_url,
  land_epic_totem_icon_url,
  land_legendary_totem_icon_url,
  land_rare_totem_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { totemModifiers, totemOptions, type TotemTier } from "@/types/planner";
import BlockIcon from "@mui/icons-material/Block";
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

const ICONS: Record<Exclude<TotemTier, "none">, string> = {
  common: land_common_totem_icon_url,
  rare: land_rare_totem_icon_url,
  epic: land_epic_totem_icon_url,
  legendary: land_legendary_totem_icon_url,
};

export type Props = {
  value: TotemTier;
  onChange: (tier: TotemTier) => void;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export function TotemSelector({ value, onChange, pos }: Props) {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};
  const handleChange = (e: SelectChangeEvent<TotemTier>) => {
    onChange(e.target.value as TotemTier);
  };

  const renderIcon = (tier: TotemTier, size = 20) =>
    tier === "none" ? (
      <BlockIcon fontSize="small" />
    ) : (
      <Image
        src={ICONS[tier]}
        alt={`${tier} totem`}
        width={size}
        height={size}
        style={{ display: "block" }}
      />
    );

  return (
    <Box
      borderRadius={1}
      sx={{
        position: "absolute",
        top: y,
        left: x,
        width: w,
        p: 1,
        bgcolor: "rgba(0,0,0,0.6)",

        zIndex: 2,
      }}
    >
      <FormControl size="small" variant="outlined" sx={{ minWidth: 115 }}>
        <InputLabel sx={{ color: "common.white" }}>Totem:</InputLabel>
        <Select<TotemTier>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as TotemTier) ?? value;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {renderIcon(v)}
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {totemModifiers[v] * 100}%
                </Typography>
              </Box>
            );
          }}
          MenuProps={{ MenuListProps: { dense: true } }}
          sx={{
            bgcolor: "rgba(255,255,255,0.06)",
            ".MuiOutlinedInput-notchedOutline": { border: "none" },
            color: "common.white",
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.6)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
          }}
        >
          {totemOptions.map((v) => (
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
                  {capitalize(v)} ({totemModifiers[v] * 100}%)
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
