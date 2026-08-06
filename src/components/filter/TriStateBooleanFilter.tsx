"use client";

import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

type TriStateValue = "any" | "yes" | "no";

interface Props {
  label: string;
  value: boolean | undefined;
  onChange: (next: TriStateValue) => void;
}

function toTriStateValue(value: boolean | undefined): TriStateValue {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "any";
}

export default function TriStateBooleanFilter({
  label,
  value,
  onChange,
}: Props) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.25 }}
      >
        {label}
      </Typography>
      <ToggleButtonGroup
        size="small"
        exclusive
        fullWidth
        value={toTriStateValue(value)}
        onChange={(_, v) => {
          if (v) onChange(v as TriStateValue);
        }}
        sx={{
          "& .MuiToggleButton-root": {
            py: 0.25,
            px: 0.75,
            minHeight: 28,
            fontSize: "0.75rem",
            lineHeight: 1.15,
            textTransform: "none",
          },
        }}
      >
        <ToggleButton value="any">Any</ToggleButton>
        <ToggleButton value="yes">Yes</ToggleButton>
        <ToggleButton value="no">No</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
