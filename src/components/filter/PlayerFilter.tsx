"use client";

import { useFilters } from "@/lib/context/FilterContext";
import { FilterInput } from "@/types/filters";
import { Box, Typography } from "@mui/material";
import MultiSelect from "../ui/multiselect/MultiSelect";

type Props = {
  options: FilterInput;
};

export default function PlayerFilter({ options }: Props) {
  const { filters, setFilters } = useFilters();

  const update = (vals: string[]) => {
    setFilters((prev) => ({
      ...prev,
      filter_players: vals,
    }));
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Player
      </Typography>
      <MultiSelect
        label="Players"
        values={options.filter_players ?? []}
        selected={filters?.filter_players ?? []}
        onChange={update}
      />
    </Box>
  );
}
