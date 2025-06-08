"use client";

import React from "react";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";

interface MultiSelectProps {
  label: string;
  values: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function MultiSelect({
  label,
  values,
  selected,
  onChange,
}: MultiSelectProps) {
  const labelId = `${label.replace(/\s+/g, "-").toLowerCase()}-label`;

  const handleDelete = (valueToRemove: string) => {
    onChange(selected.filter((val) => val !== valueToRemove));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        labelId={labelId}
        multiple
        value={selected}
        onChange={(e) => onChange(e.target.value as string[])}
        input={<OutlinedInput label={label} />}
        renderValue={(selected) => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {(selected as string[]).map((value) => (
              <Chip
                key={value}
                label={value}
                size="small"
                onDelete={() => handleDelete(value)}
              />
            ))}
            {selected.length > 0 && (
              <Chip
                label="Clear"
                size="small"
                onClick={handleClearAll}
                onMouseDown={(e) => e.stopPropagation()}
                sx={{ bgcolor: "error.main", color: "white" }}
              />
            )}
          </Box>
        )}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
            },
          },
        }}
      >
        {values.map((value) => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
