"use client";

import {
  land_runi_gold_icon_url,
  land_runi_power_core_icon_url,
  land_runi_regular_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { runiOptions, RuniTier } from "@/types/planner";
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
import { COLUMN_WIDTHS } from "./gridConstants";

const ICONS: Record<RuniTier, string> = {
  none: land_runi_power_core_icon_url,
  regular: land_runi_regular_icon_url,
  gold: land_runi_gold_icon_url,
};

export type Props = {
  value: RuniTier | null;
  onChange: (tier: RuniTier | null) => void;
};

export function RuniIconSelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<string>) => {
    const val = e.target.value;
    onChange(val === "none" ? null : (val as RuniTier));
  };

  const renderIcon = (tier: RuniTier | null, size = 24) => {
    if (!tier || tier === "none") {
      return <Typography variant="body2">-</Typography>;
    }
    return (
      <Box
        sx={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src={ICONS[tier]}
          alt={`${tier} Runi`}
          width={size}
          height={size}
          style={{
            width: size,
            height: "auto",
            maxWidth: size,
            maxHeight: size,
            objectFit: "contain",
          }}
        />
      </Box>
    );
  };

  const displayValue = value || "none";

  return (
    <Box width={COLUMN_WIDTHS.MEDIUM_MINUS} flexShrink={0}>
      <Select<string>
        value={displayValue}
        onChange={handleChange}
        renderValue={(val) => {
          const v = (val as RuniTier) || "none";
          return (
            <Tooltip title={capitalize(v)}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {renderIcon(v === "none" ? null : v, 50)}
              </Box>
            </Tooltip>
          );
        }}
        size="small"
        sx={{
          ".MuiOutlinedInput-notchedOutline": { border: "none" },
          width: "100%",
        }}
      >
        <MenuItem value="none">
          <ListItemIcon>
            <BlockIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body2">None</Typography>
        </MenuItem>
        {runiOptions
          .filter((r) => r !== "none")
          .map((tier) => (
            <MenuItem key={tier} value={tier}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                {renderIcon(tier, 24)}
              </ListItemIcon>
              <Typography variant="body2">{capitalize(tier)}</Typography>
            </MenuItem>
          ))}
      </Select>
    </Box>
  );
}
