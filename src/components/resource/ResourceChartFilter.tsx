"use client";

import { ResourceHubMetrics } from "@/generated/prisma/client";
import { Autocomplete, Box, Button, Stack, TextField } from "@mui/material";
import { useState } from "react";

export function useResourceChartSelection(
  data: ResourceHubMetrics[] | undefined,
  defaultSymbols?: readonly string[]
) {
  const symbols = Array.from(
    new Set(data?.map((row) => row.token_symbol) ?? [])
  );
  const [selection, setSelection] = useState<string[] | null>(null);
  const selected = selection
    ? selection.filter((symbol) => symbols.includes(symbol))
    : defaultSymbols
      ? defaultSymbols.filter((symbol) => symbols.includes(symbol))
      : symbols.length > 8
        ? symbols.slice(0, 6)
        : symbols;
  const selectedSet = new Set(selected);
  const filteredData = data?.filter((row) => selectedSet.has(row.token_symbol));

  return { symbols, selected, setSelection, filteredData };
}

export function ResourceChartFilter({
  symbols,
  selected,
  onChange,
  limitTags = 3,
}: {
  symbols: string[];
  selected: string[];
  onChange: (selection: string[]) => void;
  limitTags?: number;
}) {
  return (
    <Box sx={{ my: 2, maxWidth: 700, width: "100%" }}>
      <Stack
        direction="row"
        spacing={1}
        alignItems="flex-start"
        width="100%"
        flexWrap="nowrap"
      >
        <Autocomplete
          multiple
          size="small"
          options={symbols}
          value={selected}
          onChange={(_, value) => onChange(value)}
          disableCloseOnSelect
          limitTags={limitTags}
          sx={{
            flex: 1,
            minWidth: 0,
            "& .MuiAutocomplete-inputRoot": {
              maxHeight: 120,
              overflowY: "auto",
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Resources in charts"
              placeholder="Search resources"
              helperText={`${selected.length} of ${symbols.length} selected`}
            />
          )}
        />
        <Stack direction="row" spacing={1} flexShrink={0} p={0.5}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onChange(symbols)}
          >
            Select all
          </Button>
          <Button size="small" variant="outlined" onClick={() => onChange([])}>
            Clear
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
