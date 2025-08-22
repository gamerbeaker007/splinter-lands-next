"use client";
import {
  land_hammer_icon_url,
  land_runi_gold_icon_url,
  land_runi_power_core_icon_url,
  land_runi_regular_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { runiModifiers, RuniTier, type TotemTier } from "@/types/planner";
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

const ICONS: Record<RuniTier, string> = {
  None: land_runi_power_core_icon_url,
  Regular: land_runi_regular_icon_url,
  Gold: land_runi_gold_icon_url,
};

const ORDER: RuniTier[] = ["None", "Regular", "Gold"];

const renderBoost = (title: string, size = 20) => (
  <Box display={"flex"} gap={2} ml={1} mt={1}>
    <Image
      src={land_hammer_icon_url}
      alt={"production PP"}
      width={size}
      height={size}
      style={{ display: "block" }}
    />

    <Typography>{title} PP</Typography>
  </Box>
);

const renderIcon = (tier: RuniTier, runiImgUrl: string | null, size = 50) => {
  const icon = runiImgUrl ?? ICONS[tier];
  const isPowerCore = icon === land_runi_power_core_icon_url;

  const isGold = icon.includes("gold");

  const style: React.CSSProperties = isPowerCore
    ? {
        objectFit: "fill",
      }
    : {
        objectFit: "cover",
        transform: `scale(1.6)`,
        transformOrigin: "center",
        objectPosition: "0% 0%",
      };

  return (
    <Box
      aria-label="Deed preview"
      sx={{
        width: size,
        height: size,
        border: "2px solid",
        borderColor: isGold ? "yellow" : "gray",
        position: "relative",
        overflow: "hidden",
        borderRadius: 1,
      }}
    >
      <Image src={icon} alt={`${tier} runi`} fill style={style} />
    </Box>
  );
};

export type Props = {
  value: RuniTier;
  runiImgUrl: string | null;
  onChange: (tier: RuniTier) => void;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export function RuniSelector({ value, runiImgUrl, onChange, pos }: Props) {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};
  const handleChange = (e: SelectChangeEvent<RuniTier>) => {
    onChange(e.target.value as RuniTier);
  };

  const label = (tier: RuniTier) => {
    return tier === "None"
      ? "Power Core (0%)"
      : `${tier} (${runiModifiers[tier] * 100}%)`;
  };

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
      <Typography>Power Core:</Typography>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <Select<TotemTier>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {renderIcon(val as RuniTier, runiImgUrl)}
              <Typography variant="body2" sx={{ color: "common.white" }}>
                {label(val as RuniTier)}
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
                {renderIcon(tier, null, 24)}
              </ListItemIcon>
              <ListItemText primary={label(tier)} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {value === "Regular" && renderBoost("1.500")}
      {value === "Gold" && renderBoost("10.000")}
    </Box>
  );
}
