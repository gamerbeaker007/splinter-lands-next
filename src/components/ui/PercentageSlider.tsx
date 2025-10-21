"use client";

import { Box, Slider, TextField } from "@mui/material";
import React from "react";

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
    <Box
      display={"flex"}
      alignItems={"center"}
      gap={2}
      maxWidth={300}
      width={"100%"}
      minWidth={200}
    >
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
        sx={{ minWidth: 75, flex: 1 }}
      />
      <TextField
        type="number"
        value={value}
        onChange={handleTextFieldChange}
        size="small"
        slotProps={{
          htmlInput: { min: 0, max: 100 },
          input: { endAdornment: "%" },
        }}
        disabled={disabled}
        aria-label={label ? `${label} percentage input` : "Percentage input"}
        sx={{
          minWidth: 80,
          width: 100,
          "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
            {
              display: "none",
            },
          "& input[type=number]": {
            MozAppearance: "textfield",
          },
        }}
      />
    </Box>
  );
}
