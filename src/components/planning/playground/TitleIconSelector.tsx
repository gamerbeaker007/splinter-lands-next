"use client";

import {
  land_title_epic_icon_url,
  land_title_legendary_icon_url,
  land_title_rare_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { titleOptions, TitleTier } from "@/types/planner";
import BlockIcon from "@mui/icons-material/Block";
import {
  Box,
  capitalize,
  ListItemIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";

const ICONS: Record<Exclude<TitleTier, "none">, string> = {
  rare: land_title_rare_icon_url,
  epic: land_title_epic_icon_url,
  legendary: land_title_legendary_icon_url,
};

export type Props = {
  value: TitleTier | null;
  onChange: (tier: TitleTier | null) => void;
};

export function TitleIconSelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<string>) => {
    const val = e.target.value;
    onChange(val === "none" ? null : (val as TitleTier));
  };

  const renderIcon = (tier: TitleTier | null, size = 24) => {
    if (!tier || tier === "none") {
      return <Typography variant="body2">-</Typography>;
    }
    return (
      <Image
        src={ICONS[tier]}
        alt={`${tier} Title`}
        width={size}
        height={size}
        style={{ display: "block", objectFit: "contain" }}
      />
    );
  };

  const displayValue = value || "none";

  return (
    <Select<string>
      value={displayValue}
      onChange={handleChange}
      renderValue={(val) => {
        const v = (val as TitleTier) || "none";
        return (
          <Tooltip title={capitalize(v)}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {renderIcon(v === "none" ? null : v, 24)}
            </Box>
          </Tooltip>
        );
      }}
      size="small"
      sx={{
        ".MuiOutlinedInput-notchedOutline": { border: "none" },
        minWidth: "auto",
        width: "fit-content",
      }}
    >
      <MenuItem value="none">
        <ListItemIcon>
          <BlockIcon fontSize="small" />
        </ListItemIcon>
        <Typography variant="body2">None</Typography>
      </MenuItem>
      {titleOptions
        .filter((t) => t !== "none")
        .map((tier) => (
          <MenuItem key={tier} value={tier}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              {renderIcon(tier, 24)}
            </ListItemIcon>
            <Typography variant="body2">{capitalize(tier)}</Typography>
          </MenuItem>
        ))}
    </Select>
  );
}
