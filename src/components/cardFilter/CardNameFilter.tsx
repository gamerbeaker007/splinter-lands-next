"use client";

import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";
import { Box, TextField, Typography } from "@mui/material";

export default function CardNameFilter() {
  const { cardFilters, setCardFilters } = useCardFilters();

  const value = cardFilters.filter_card_name ?? "";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
      }}
    >
      <Typography sx={{ fontSize: "0.8rem" }}>Card Name:</Typography>
      <TextField
        placeholder="Search card name"
        size="small"
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setCardFilters((prev) => {
            if (!next.trim()) {
              const rest = { ...prev };
              delete rest.filter_card_name;
              return rest;
            }
            return { ...prev, filter_card_name: next };
          });
        }}
      />
    </Box>
  );
}
