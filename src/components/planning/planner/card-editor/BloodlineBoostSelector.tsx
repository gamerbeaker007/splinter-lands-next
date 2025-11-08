"use client";

import PercentageSlider from "@/components/ui/PercentageSlider";
import { CardBloodline } from "@/types/planner/primitives";
import {
  Box,
  capitalize,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

interface BloodlineBoost {
  bloodline: CardBloodline;
  value: number;
}

interface BloodlineBoostSelectorProps {
  boost: BloodlineBoost;
  allowedBloodlines: CardBloodline[];
  onChange: (bloodline: CardBloodline, value: number) => void;
}

const capitalizeBloodline = (bloodline: string): string => {
  return capitalize(bloodline.toLowerCase());
};

export default function BloodlineBoostSelector({
  boost,
  allowedBloodlines,
  onChange,
}: BloodlineBoostSelectorProps) {
  const handleBloodlineChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as CardBloodline, boost.value);
  };

  const handleValueChange = (value: number) => {
    onChange(boost.bloodline, value);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        gap: 2,
      }}
    >
      {/* Bloodline Selection */}
      <Box sx={{ minWidth: 150, width: { xs: "100%", sm: "auto" } }}>
        <FormControl fullWidth size="small">
          <InputLabel>Bloodline</InputLabel>
          <Select
            value={boost.bloodline}
            label="Bloodline"
            onChange={handleBloodlineChange}
          >
            {allowedBloodlines.map((bloodline) => (
              <MenuItem key={bloodline} value={bloodline}>
                <ListItemText primary={capitalizeBloodline(bloodline)} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Percentage Slider */}
      <PercentageSlider
        value={boost.value}
        onChange={handleValueChange}
        label={`${capitalizeBloodline(boost.bloodline)} boost`}
      />
    </Box>
  );
}
