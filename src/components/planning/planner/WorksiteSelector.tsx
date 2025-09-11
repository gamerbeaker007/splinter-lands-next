"use client";
import { CSSSize } from "@/types/cssSize";
import {
  allowedTerrainsByWorksite,
  DeedType,
  PlotStatus,
  worksiteIconMap,
  WorksiteType,
  worksiteTypeOptions,
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
  value: WorksiteType;
  deedType: DeedType;
  plotStatus: PlotStatus;
  onChange: (tier: WorksiteType) => void;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

const FORTS = new Set<WorksiteType>(["CASTLE", "KEEP"]);

export function isAllowed(
  worksite: WorksiteType,
  deedType: DeedType,
  plotStatus: PlotStatus,
): boolean {
  // Forts are only valid on kingdom plots
  if (FORTS.has(worksite)) return plotStatus === "kingdom";

  // On kingdom plots, only CASTLE/KEEP are allowed
  if (plotStatus === "kingdom") return false;

  // Terrain-gated worksites
  const terrains = allowedTerrainsByWorksite[worksite];
  return !terrains || terrains.includes(deedType);
}

export function WorksiteSelector({
  value,
  onChange,
  pos,
  deedType,
  plotStatus,
}: Props) {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};

  const allowedOptions = useMemo(
    () => worksiteTypeOptions.filter((w) => isAllowed(w, deedType, plotStatus)),
    [deedType, plotStatus],
  );

  // Auto-correct selection when it becomes disallowed
  useEffect(() => {
    if (!isAllowed(value, deedType, plotStatus)) {
      // Pick the first allowed option according to fallbackPriority
      const next =
        worksiteTypeOptions.find((w) => isAllowed(w, deedType, plotStatus)) ??
        allowedOptions[0]; // safety fallback
      if (next && next !== value) onChange(next);
    }
  }, [value, deedType, plotStatus, onChange, allowedOptions]);

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
        src={worksiteIconMap[worksite]}
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
          {worksiteTypeOptions.map((v) => {
            const allowed = isAllowed(v, deedType, plotStatus);

            return (
              <MenuItem key={v} value={v} disabled={!allowed}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {renderIcon(v, 40)}
                </ListItemIcon>
                <Typography variant="body2" sx={{ flexGrow: 1 }} ml={1}>
                  {capitalize(v)}
                </Typography>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
}
