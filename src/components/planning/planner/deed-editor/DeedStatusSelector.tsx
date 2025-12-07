"use client";
import { determineDeedResourceBoost } from "@/lib/frontend/utils/plannerCalcs";
import { land_default_off_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import {
  PlotRarity,
  PlotStatus,
  plotStatusOptions,
  WorksiteType,
} from "@/types/planner";
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
import { useEffect, useMemo } from "react";

export type Props = {
  value: PlotStatus;
  rarity: PlotRarity;
  worksiteType: WorksiteType;
  onChange: (tier: PlotStatus) => void;
};

export function isAllowedStatus(
  status: PlotStatus,
  rarity?: PlotRarity
): boolean {
  if (rarity === "mythic") return status === "kingdom";
  return status !== "kingdom";
}

export function PlotStatusSelector({
  value,
  onChange,
  rarity,
  worksiteType,
}: Props) {
  // allowed statuses for current rarity
  const allowedOptions = useMemo(
    () => plotStatusOptions.filter((s) => isAllowedStatus(s, rarity)),
    [rarity]
  );

  // auto-correct if current value becomes invalid
  useEffect(() => {
    if (!isAllowedStatus(value, rarity)) {
      const next =
        plotStatusOptions.find((s) => isAllowedStatus(s, rarity)) ??
        allowedOptions[0];
      if (next && next !== value) onChange(next);
    }
  }, [value, rarity, onChange, allowedOptions]);

  const handleChange = (e: SelectChangeEvent<PlotStatus>) => {
    onChange(e.target.value as PlotStatus);
  };

  const renderIcon = (tier: PlotStatus, size = 24) => {
    const icon = land_default_off_icon_url_placeholder.replace(
      "__NAME__",
      tier.toLowerCase()
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

  const deedResourceBoost = determineDeedResourceBoost(value, worksiteType);

  return (
    <Box borderRadius={1}>
      <FormControl size="small" variant="outlined">
        <InputLabel>Status:</InputLabel>
        <Select<PlotStatus>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as PlotStatus) ?? value;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {renderIcon(v)}
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {capitalize(v)}{" "}
                  {deedResourceBoost > 0 ? `(${deedResourceBoost * 100}%)` : ""}
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
          {plotStatusOptions.map((s) => {
            const allowed = isAllowedStatus(s, rarity);

            return (
              <MenuItem key={s} value={s} disabled={!allowed}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {renderIcon(s, 18)}
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
                    {capitalize(s)}
                  </Typography>
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
