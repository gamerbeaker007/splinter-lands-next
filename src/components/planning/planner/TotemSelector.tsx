"use client";
import {
  land_common_totem_icon_url,
  land_epic_totem_icon_url,
  land_legendary_totem_icon_url,
  land_rare_totem_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { totemModifiers, type TotemTier } from "@/types/planner";
import BlockIcon from "@mui/icons-material/Block";
import {
  Box,
  FormControl,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import Image from "next/image";

const ICONS: Record<Exclude<TotemTier, "None">, string> = {
  Common: land_common_totem_icon_url,
  Rare: land_rare_totem_icon_url,
  Epic: land_epic_totem_icon_url,
  Legendary: land_legendary_totem_icon_url,
};

const ORDER: TotemTier[] = ["None", "Common", "Rare", "Epic", "Legendary"];

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
    tier === "None" ? (
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

  const label = (tier: TotemTier) => `${tier} (${totemModifiers[tier] * 100}%)`;

  return (
    <Box
      borderRadius={1}
      sx={{
        position: "absolute",
        top: x,
        left: y,
        width: w,
        p: 1,
        bgcolor: "rgba(0,0,0,0.45)",

        zIndex: 2,
      }}
    >
      <Typography>Totem:</Typography>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <Select<TotemTier>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {renderIcon(val as TotemTier)}
              <Typography variant="body2" sx={{ color: "common.white" }}>
                {label(val as TotemTier)}
              </Typography>
            </Box>
          )}
          MenuProps={{
            MenuListProps: { dense: true },
          }}
          sx={{
            bgcolor: "rgba(255,255,255,0.06)",
            color: "common.white",
            ".MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.3)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.6)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
          }}
        >
          {ORDER.map((tier) => (
            <MenuItem key={tier} value={tier}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {renderIcon(tier, 24)}
              </ListItemIcon>
              <ListItemText primary={label(tier)} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
