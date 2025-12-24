"use client";

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
  ListItemIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
} from "@mui/material";
import Image from "next/image";

export type Props = {
  value: WorksiteType;
  deedType: DeedType;
  plotStatus: PlotStatus;
  onChange: (tier: WorksiteType) => void;
};

const FORTS = new Set<WorksiteType>(["CASTLE", "KEEP"]);

export function isAllowed(
  worksite: WorksiteType,
  deedType: DeedType,
  plotStatus: PlotStatus
): boolean {
  // Forts are only valid on kingdom plots
  if (FORTS.has(worksite)) return plotStatus === "kingdom";

  // On kingdom plots, only CASTLE/KEEP are allowed
  if (plotStatus === "kingdom") return false;

  // Terrain-gated worksites
  const terrains = allowedTerrainsByWorksite[worksite];
  return !terrains || terrains.includes(deedType);
}

export function WorksiteIconSelector({
  value,
  onChange,
  deedType,
  plotStatus,
}: Props) {
  const handleChange = (e: SelectChangeEvent<WorksiteType>) => {
    const newValue = e.target.value as WorksiteType;
    // Only allow changing to valid options
    if (isAllowed(newValue, deedType, plotStatus)) {
      onChange(newValue);
    }
  };

  // Icon renderer
  const renderIcon = (worksite: WorksiteType, size = 24) => (
    (
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
            objectFit: "contain",
            objectPosition: "center",
            display: "block",
          }}
        />
      </Box>
    )
  );

  return (
    <Select<WorksiteType>
      value={value}
      onChange={handleChange}
      renderValue={(val) => {
        const v = (val as WorksiteType) ?? value;
        return (
          <Tooltip title={capitalize(v)}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {renderIcon(v, 40)}
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
      {worksiteTypeOptions.map((v) => {
        const allowed = isAllowed(v, deedType, plotStatus);

        return (
          <MenuItem key={v} value={v} disabled={!allowed}>
            <ListItemIcon sx={{ minWidth: 28 }}>
              {renderIcon(v, 32)}
            </ListItemIcon>
            <Typography variant="body2" sx={{ flexGrow: 1 }} ml={1}>
              {capitalize(v)}
            </Typography>
          </MenuItem>
        );
      })}
    </Select>
  );
}
