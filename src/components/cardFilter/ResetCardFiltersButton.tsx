import { Button } from "@mui/material";
import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";

export default function ResetCardFiltersButton() {
  const { resetFilters } = useCardFilters();

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
