"use client";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

export type Props = {
  text: string;
  value: number;
  range: number;
  onChange: (number: number) => void;
};

const buildRangeItems = (max: number) =>
  Array.from({ length: max }, (_, i) => i + 1).map((n) => (
    <MenuItem key={n} value={n}>
      {n}
    </MenuItem>
  ));

export function NumberSelection({ text, value, range, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<number>) =>
    onChange?.(Number(e.target.value));

  return (
    <Box borderRadius={1}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel id="region-select-label">{text}</InputLabel>
        <Select<number>
          label={text}
          value={value ?? ("" as unknown as number)}
          onChange={handleChange}
          displayEmpty
          renderValue={(v) => (v ? String(v) : `Select ${text}`)}
        >
          {buildRangeItems(range)}
        </Select>
      </FormControl>
    </Box>
  );
}
