import { useFilters } from "@/lib/frontend/context/FilterContext";
import {
  SortDirection,
  SortOption,
  SortOptionKey,
  defaultSortOptions,
} from "@/types/sorting";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

type Props = {
  options?: SortOption[];
};

export default function SortingFilter({ options = defaultSortOptions }: Props) {
  const { filters, setFilters } = useFilters();
  const sortSelection = filters.sorting;

  const sortKey = sortSelection?.key ?? "";
  const direction: SortDirection = sortSelection?.direction ?? "desc";

  const handleKeyChange = (e: SelectChangeEvent) => {
    const key = e.target.value as SortOptionKey;
    if (!key) return;

    setFilters((prev) => ({
      ...prev,
      sorting: {
        key,
        direction: prev.sorting?.direction ?? "desc", // preserve current direction
      },
    }));
  };

  const handleDirectionChange = (
    _: React.MouseEvent<HTMLElement>,
    newDirection: SortDirection | null
  ) => {
    if (!newDirection || !sortKey) return;

    setFilters((prev) => ({
      ...prev,
      sorting: {
        key: sortKey as SortOptionKey,
        direction: newDirection,
      },
    }));
  };

  return (
    <Box display="flex" gap={1} flexDirection="column">
      <Typography variant="h5" gutterBottom>
        Sorting
      </Typography>
      <FormControl fullWidth>
        <InputLabel id="sort-by-label">Sort By</InputLabel>
        <Select
          labelId="sort-by-label"
          value={sortKey}
          label="Sort By"
          onChange={handleKeyChange}
        >
          {options.map((opt) => (
            <MenuItem key={opt.key} value={opt.key}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <ToggleButtonGroup
        value={direction}
        exclusive
        onChange={handleDirectionChange}
        aria-label="Sort direction"
        size="small"
        color="primary"
      >
        <ToggleButton value="asc" aria-label="ascending">
          Ascending
        </ToggleButton>
        <ToggleButton value="desc" aria-label="descending">
          Descending
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
