"use client";

import React from "react";
import {
  Box,
  FormControl,
  ListItemIcon,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { Resource } from "@/constants/resource/resource";
import { PRODUCING_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import PercentageSlider from "@/components/ui/PercentageSlider";
import Image from "next/image";

interface ResourceBoost {
  resource: Resource;
  value: number;
}

interface ProductionBoostSelectorProps {
  boosts: ResourceBoost[];
  onUpdate: (
    index: number,
    field: keyof ResourceBoost,
    value: Resource | number
  ) => void;
}

export default function ProductionBoostSelector({
  boosts,
  onUpdate,
}: ProductionBoostSelectorProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {boosts.map((boost, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FormControl sx={{ minWidth: 150 }}>
            <Select
              value={boost.resource}
              onChange={(e) =>
                onUpdate(index, "resource", e.target.value as Resource)
              }
              renderValue={(selected) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Image
                    src={RESOURCE_ICON_MAP[selected]}
                    alt={selected}
                    width={30}
                    height={30}
                  />
                  <Typography>{selected}</Typography>
                </Box>
              )}
            >
              {PRODUCING_RESOURCES.map((resource) => (
                <MenuItem key={resource} value={resource}>
                  <ListItemIcon>
                    <Image
                      src={RESOURCE_ICON_MAP[resource]}
                      alt={resource}
                      width={30}
                      height={30}
                    />
                  </ListItemIcon>
                  <Typography>{resource}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flex: 1 }}>
            <PercentageSlider
              value={boost.value}
              onChange={(value) => onUpdate(index, "value", value)}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
