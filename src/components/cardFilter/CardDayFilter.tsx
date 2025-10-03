"use client";

import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, TextField } from "@mui/material";
import { useCardFilters } from "@/lib/frontend/context/CardFilterContext";

type Props = {
  title: string;
  filterKey: "filter_last_used";
  delay?: number;
};

export default function CardDayFilter({
  title,
  filterKey,
  delay = 300,
}: Props) {
  const { cardFilters, setCardFilters } = useCardFilters();

  // --- Local typing state (string) ---
  const [localValue, setLocalValue] = useState<string>(
    cardFilters[filterKey]?.toString() ?? "",
  );

  // Track focus to avoid fighting the user while typing
  const focusedRef = useRef(false);

  // --- Debounce localValue ---
  const [debouncedValue, setDebouncedValue] = useState(localValue);
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedValue(localValue), delay);
    return () => window.clearTimeout(id);
  }, [localValue, delay]);

  // Keep a record of the last committed raw string (prevents loops)
  const lastCommittedRef = useRef<string>(
    cardFilters[filterKey]?.toString() ?? "",
  );

  // Helper: normalize to the string we store/compare
  const normalize = (v: string) => v.trim();

  // Commit to context only when the debounced value actually changed from last commit
  useEffect(() => {
    const next = normalize(debouncedValue);
    if (next === normalize(lastCommittedRef.current)) return;

    const num = next === "" ? undefined : Number(next);
    // If invalid number, don’t commit
    if (next !== "" && Number.isNaN(num)) return;

    setCardFilters((prev) => ({ ...prev, [filterKey]: num }));
    lastCommittedRef.current = next;
  }, [debouncedValue, filterKey, setCardFilters]);

  // Sync local input when context changes externally (and input not focused)
  useEffect(() => {
    const ctxStr = cardFilters[filterKey]?.toString() ?? "";
    if (!focusedRef.current && ctxStr !== localValue) {
      setLocalValue(ctxStr);
      lastCommittedRef.current = ctxStr; // keep commit marker aligned
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardFilters[filterKey]]);

  // Immediate commit (blur or Enter)
  const commitNow = () => {
    const next = normalize(localValue);
    if (next === normalize(lastCommittedRef.current)) return;

    const num = next === "" ? undefined : Number(next);
    if (next !== "" && Number.isNaN(num)) return;

    setCardFilters((prev) => ({ ...prev, [filterKey]: num }));
    lastCommittedRef.current = next;
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
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <TextField
          label="days"
          type="number"
          size="small"
          value={localValue}
          onFocus={() => {
            focusedRef.current = true;
          }}
          onBlur={() => {
            focusedRef.current = false;
            commitNow();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur(); // triggers onBlur -> commitNow
            }
          }}
          onChange={(e) => setLocalValue(e.target.value)}
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
