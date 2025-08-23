"use client";
import {
  land_aura_lab_icon_url,
  land_grain_farm_icon_url,
  land_logging_camp_icon_url,
  land_ore_mine_icon_url,
  land_quarry_icon_url,
  land_research_hut_icon_url,
  land_shard_mine_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import { WorksiteType, worksiteTypeOptions } from "@/types/planner";
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

const ICONS: Record<WorksiteType, string> = {
  "Grain Farm": land_grain_farm_icon_url,
  "Logging Camp": land_logging_camp_icon_url,
  "Ore Mine": land_ore_mine_icon_url,
  Quarry: land_quarry_icon_url,
  "Research Hut": land_research_hut_icon_url,
  "Aura Lab": land_aura_lab_icon_url,
  "Shard Mine": land_shard_mine_icon_url,
};

export type Props = {
  value: WorksiteType;
  onChange: (tier: WorksiteType) => void;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export function WorksiteSelector({ value, onChange, pos }: Props) {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  const handleChange = (e: SelectChangeEvent<WorksiteType>) => {
    onChange(e.target.value as WorksiteType);
  };

  // Icon that keeps aspect ratio (square slot by default)
  const renderIcon = (worksite: WorksiteType, size = 24) => (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
      }}
    >
      <Image
        src={ICONS[worksite]}
        alt={`${worksite} icon`}
        fill
        sizes={`${size}px`}
        style={{
          objectFit: "contain", // keep native ratio inside the box
          objectPosition: "center",
          display: "block",
        }}
      />
    </Box>
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
      <FormControl size="small" variant="outlined" sx={{ minWidth: 250 }}>
        <InputLabel sx={{ color: "common.white" }}>Worksite</InputLabel>
        <Select<WorksiteType>
          value={value}
          onChange={handleChange}
          label="Worksite"
          renderValue={(val) => {
            const v = (val as WorksiteType) ?? value;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {renderIcon(v, 50)}
                <Typography variant="body2" ml={1} sx={{ flexGrow: 1 }}>
                  {v}
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
          {worksiteTypeOptions.map((v) => (
            <MenuItem key={v} value={v}>
              <ListItemIcon sx={{ minWidth: 28 }}>
                {renderIcon(v, 40)}
              </ListItemIcon>
              <Typography variant="body2" sx={{ flexGrow: 1 }} ml={1}>
                {capitalize(v)}
              </Typography>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
