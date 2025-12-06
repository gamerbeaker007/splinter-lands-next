"use client";

import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { Box, TextField, Typography } from "@mui/material";
import { useState } from "react";

type Props = {
  title: string;
  filterKey: "filter_last_used";
};

export default function CardDayFilter({ title, filterKey }: Props) {
  const { cardFilters, setCardFilters } = useCardFilters();

  const [localValue, setLocalValue] = useState<string>(
    cardFilters[filterKey]?.toString() ?? ""
  );

  const commitValue = () => {
    const trimmed = localValue.trim();
    const num = trimmed === "" ? undefined : Number(trimmed);

    // Only commit if valid number or empty
    if (trimmed === "" || !Number.isNaN(num)) {
      setCardFilters((prev) => ({ ...prev, [filterKey]: num }));
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 1,
      }}
    >
      <Typography sx={{ fontSize: "0.8rem" }}>{title}:</Typography>
      <Box sx={{ display: "flex", maxWidth: "150px", gap: 0.5 }}>
        <TextField
          label="days"
          type="number"
          size="small"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={commitValue}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitValue();
              e.currentTarget.blur();
            }
          }}
          slotProps={{
            input: {
              inputProps: {
                min: 0,
                step: 1,
                inputMode: "numeric",
                pattern: "[0-9]*",
              },
            },
          }}
        />
      </Box>
    </Box>
  );
}
