"use client";

import { useFilters } from "@/lib/context/FilterContext";
import { FilterInput } from "@/types/filters";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Typography,
} from "@mui/material";
import MultiSelect from "./multiselect/MultiSelect";

type Props = {
  options: FilterInput;
};

type BooleanFilterKey =
  | "filter_developed"
  | "filter_under_construction"
  | "filter_has_pp";

export default function AttributeFilter({ options }: Props) {
  const { filters, setFilters } = useFilters();

  const update = (field: keyof FilterInput, values: string[]) => {
    setFilters((prev) => ({ ...prev, [field]: values }));
  };

  const toggleBoolean = (key: BooleanFilterKey) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (prev[key]) {
        delete newFilters[key]; // remove filter if unchecked
      } else {
        newFilters[key] = true;
      }
      return newFilters;
    });
  };

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        Attributes
      </Typography>

      <MultiSelect
        label="Rarity"
        values={options.filter_rarity ?? []}
        selected={filters?.filter_rarity ?? []}
        onChange={(vals) => update("filter_rarity", vals)}
      />
      <MultiSelect
        label="Resources"
        values={options.filter_resources ?? []}
        selected={filters?.filter_resources ?? []}
        onChange={(vals) => update("filter_resources", vals)}
      />
      <MultiSelect
        label="Worksites"
        values={options.filter_worksites ?? []}
        selected={filters?.filter_worksites ?? []}
        onChange={(vals) => update("filter_worksites", vals)}
      />
      <MultiSelect
        label="Deed Type"
        values={options.filter_deed_type ?? []}
        selected={filters?.filter_deed_type ?? []}
        onChange={(vals) => update("filter_deed_type", vals)}
      />
      <MultiSelect
        label="Plot Status"
        values={options.filter_plot_status ?? []}
        selected={filters?.filter_plot_status ?? []}
        onChange={(vals) => update("filter_plot_status", vals)}
      />

      <FormGroup sx={{ mt: 2 }}>
        {(
          [
            "filter_developed",
            "filter_under_construction",
            "filter_has_pp",
          ] as BooleanFilterKey[]
        ).map((key) => (
          <FormControlLabel
            key={key}
            control={
              <Checkbox
                checked={filters?.[key] === true}
                onChange={() => toggleBoolean(key)}
                size="small"
              />
            }
            label={key
              .replace("filter_", "")
              .replace(/_/g, " ")
              .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())}
          />
        ))}
      </FormGroup>
    </Box>
  );
}
