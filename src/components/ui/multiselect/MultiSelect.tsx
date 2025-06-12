"use client";

import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
} from "@mui/material";

interface MultiSelectProps<T extends string | number = string | number> {
  label: string;
  values: T[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

export default function MultiSelect<T extends string | number>({
  label,
  values,
  selected,
  onChange,
}: MultiSelectProps<T>) {
  const labelId = `${label.replace(/\s+/g, "-").toLowerCase()}-label`;

  const handleDelete = (valueToRemove: T) => {
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
        onChange={(e) => onChange(e.target.value as T[])}
        input={<OutlinedInput label={label} />}
        renderValue={(selectedItems) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 0.5,
            }}
          >
            <Box
              sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, flexGrow: 1 }}
            >
              {(selectedItems as T[]).map((value) => (
                <Chip
                  key={value}
                  label={value}
                  size="small"
                  onMouseDown={(e) => e.stopPropagation()}
                  onDelete={(e) => {
                    e.stopPropagation();
                    handleDelete(value);
                  }}
                />
              ))}
            </Box>

            {selectedItems.length > 0 && (
              <Chip
                label="X"
                size="small"
                onClick={handleClearAll}
                onMouseDown={(e) => e.stopPropagation()}
                sx={{
                  bgcolor: "error.main",
                  color: "white",
                  fontSize: "0.625rem", // ~10px = XS
                  ml: 1,
                  height: 20,
                }}
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
