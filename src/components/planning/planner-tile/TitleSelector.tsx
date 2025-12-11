"use client";
import {
  land_title_epic_icon_url,
  land_title_legendary_icon_url,
  land_title_rare_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { titleModifiers, titleOptions, TitleTier } from "@/types/planner";
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

const ICONS: Record<Exclude<TitleTier, "none">, string> = {
  rare: land_title_rare_icon_url,
  epic: land_title_epic_icon_url,
  legendary: land_title_legendary_icon_url,
};

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
    tier === "none" ? (
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

  const fontColor = "common.white";

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
      <FormControl size="small" variant="outlined" sx={{ minWidth: 100 }}>
        <InputLabel sx={{ color: fontColor }}>Title:</InputLabel>
        <Select<TitleTier>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as TitleTier) ?? value;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {renderIcon(v)}
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {titleModifiers[v] * 100}%
                </Typography>
              </Box>
            );
          }}
          MenuProps={{ MenuListProps: { dense: true } }}
          sx={{
            bgcolor: "rgba(255,255,255,0.06)",
            ".MuiOutlinedInput-notchedOutline": { border: "none" },
            color: fontColor,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.6)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
          }}
        >
          {titleOptions.map((v) => (
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
                  {capitalize(v)} ({titleModifiers[v] * 100}%)
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
