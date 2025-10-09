"use client";

import React from "react";
import { Box, Slider, TextField, Grid } from "@mui/material";

interface PercentageSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
}

export default function PercentageSlider({
  value,
  onChange,
  label,
  disabled = false,
}: PercentageSliderProps) {
  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    onChange(newValue as number);
  };

  const handleTextFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newValue = Math.min(
      100,
      Math.max(0, parseInt(event.target.value) || 0),
    );
    onChange(newValue);
  };

  return (
    <Box sx={{ maxWidth: 400, width: "100%" }}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 8 }}>
          <Slider
            value={value}
            onChange={handleSliderChange}
            min={0}
            max={100}
            step={1}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}%`}
            disabled={disabled}
            aria-label={label}
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <TextField
            type="number"
            value={value}
            onChange={handleTextFieldChange}
            size="small"
            inputProps={{ min: 0, max: 100 }}
            InputProps={{ endAdornment: "%" }}
            fullWidth
            disabled={disabled}
            aria-label={
              label ? `${label} percentage input` : "Percentage input"
            }
          />
        </Grid>
      </Grid>
    </Box>
  );
}
