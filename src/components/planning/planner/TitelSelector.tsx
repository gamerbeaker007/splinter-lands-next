"use client";
import {
  land_title_epic_icon_url,
  land_title_legendary_icon_url,
  land_title_rare_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { titleModifiers, TitleTier } from "@/types/planner";
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

const ICONS: Record<Exclude<TitleTier, "None">, string> = {
  Rare: land_title_rare_icon_url,
  Epic: land_title_epic_icon_url,
  Legendary: land_title_legendary_icon_url,
};

const ORDER: TitleTier[] = ["None", "Rare", "Epic", "Legendary"];

export type Props = {
  value: TitleTier;
  onChange: (tier: TitleTier) => void;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export function TitleSelector({ value, onChange, pos }: Props) {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};
  const handleChange = (e: SelectChangeEvent<TitleTier>) => {
    onChange(e.target.value as TitleTier);
  };

  const renderIcon = (tier: TitleTier, size = 20) =>
    tier === "None" ? (
      <BlockIcon fontSize="small" />
    ) : (
      <Image
        src={ICONS[tier]}
        alt={`${tier} Title`}
        width={size}
        height={size}
        style={{ display: "block" }}
      />
    );

  const label = (tier: TitleTier) => `${tier} (${titleModifiers[tier] * 100}%)`;

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
      <Typography>Title:</Typography>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <Select<TitleTier>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {renderIcon(val as TitleTier)}
              <Typography variant="body2" sx={{ color: "common.white" }}>
                {label(val as TitleTier)}
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
