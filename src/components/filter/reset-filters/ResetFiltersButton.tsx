import React from "react";
import { Button } from "@mui/material";
import { useFilters } from "@/lib/frontend/context/FilterContext";

export default function ResetFiltersButton() {
  const { setFilters } = useFilters();

  const handleClear = () => {
    setFilters({}); // Reset all filters to empty object
  };

  return (
    <Button
      variant="outlined"
      color="secondary"
      onClick={handleClear}
      sx={{ mt: 2 }}
    >
      Clear All Filters
    </Button>
  );
}
