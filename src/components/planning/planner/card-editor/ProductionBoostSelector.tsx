"use client";

import React from "react";
import {
  Box,
  capitalize,
  FormControl,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { Resource } from "@/constants/resource/resource";
import { PRODUCING_RESOURCES, RESOURCE_ICON_MAP } from "@/lib/shared/statics";
import PercentageSlider from "@/components/ui/PercentageSlider";
import Image from "next/image";

interface ResourceBoost {
  resource: Resource;
  value: number;
}

interface ProductionBoostSelectorProps {
  boost: ResourceBoost;
  index: number;
  onUpdate: (
    index: number,
    field: keyof ResourceBoost,
    value: Resource | number,
  ) => void;
  onRemove: (index: number) => void;
}

const capitalizeResource = (resource: string): string => {
  return capitalize(resource.toLowerCase());
};

export default function ProductionBoostSelector({
  boost,
  index,
  onUpdate,
  onRemove,
}: ProductionBoostSelectorProps) {
  const handleResourceChange = (event: SelectChangeEvent<string>) => {
    onUpdate(index, "resource", event.target.value as Resource);
  };

  const handleValueChange = (value: number) => {
    onUpdate(index, "value", value);
  };

  const handleRemove = () => {
    onRemove(index);
  };

  return (
    <Box
      sx={{
        mb: 2,
        p: 1.5,
        border: 1,
        borderRadius: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
        }}
      >
        {/* Resource Selection */}
        <Box sx={{ minWidth: 85, width: { xs: "100%", sm: "auto" } }}>
          <FormControl fullWidth size="small">
            <InputLabel>Resource</InputLabel>
            <Select
              value={boost.resource}
              label="Resource"
              onChange={handleResourceChange}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Image
                    src={RESOURCE_ICON_MAP[selected as Resource]}
                    alt={selected}
                    width={20}
                    height={20}
                  />
                </Box>
              )}
            >
              {PRODUCING_RESOURCES.map((resource) => (
                <MenuItem key={resource} value={resource}>
                  <ListItemIcon sx={{ minWidth: "30px !important" }}>
                    <Image
                      src={RESOURCE_ICON_MAP[resource as Resource]}
                      alt={resource}
                      width={20}
                      height={20}
                    />
                  </ListItemIcon>
                  <ListItemText primary={capitalizeResource(resource)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Percentage Slider */}
        <PercentageSlider
          value={boost.value}
          onChange={handleValueChange}
          label={`${capitalizeResource(boost.resource)} production boost`}
        />

        {/* Delete Button */}

        <IconButton
          onClick={handleRemove}
          size="small"
          color="error"
          sx={{
            minWidth: 40,
            height: 40,
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
