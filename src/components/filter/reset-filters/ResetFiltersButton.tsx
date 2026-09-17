import { Button } from "@mui/material";
import { useFilters } from "@/lib/frontend/context/FilterContext";

export default function ResetFiltersButton() {
  const { resetFilters } = useFilters();

  const handleClear = () => {
    resetFilters();
  };

  return (
    <Button
      variant="outlined"
      color="secondary"
      onClick={handleClear}
      fullWidth
    >
      Clear All Filters
    </Button>
  );
}
