import { Stack, TextField } from "@mui/material";
import { useState } from "react";

type Props = {
  min?: number | null;
  max?: number | null;
  onChange: (min?: number | null, max?: number | null) => void;
};

export function PPRangeFilter({ min, max, onChange }: Props) {
  const format = (val: number | null | undefined) =>
    val != null && !Number.isNaN(val)
      ? val.toLocaleString(undefined, { maximumFractionDigits: 0 })
      : "";

  const [minStr, setMinStr] = useState(format(min));
  const [maxStr, setMaxStr] = useState(format(max));

  const commit = (which: "min" | "max", str: string) => {
    const numeric = str.replace(/,/g, ""); // strip commas
    const n = numeric.trim() === "" ? null : Number(numeric);
    const safe = Number.isFinite(n as number) ? (n as number) : null;

    if (which === "min") {
      setMinStr(format(safe));
      onChange(safe, max);
    } else {
      setMaxStr(format(safe));
      onChange(min, safe);
    }
  };

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      <TextField
        label="PP min"
        size="small"
        value={minStr}
        onChange={(e) => setMinStr(e.target.value)}
        onBlur={() => commit("min", minStr)}
      />
      <TextField
        label="PP max"
        size="small"
        value={maxStr}
        onChange={(e) => setMaxStr(e.target.value)}
        onBlur={() => commit("max", maxStr)}
      />
    </Stack>
  );
}
