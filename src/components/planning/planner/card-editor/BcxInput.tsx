import { determineCardMaxBCX } from "@/lib/utils/cardUtil";
import { SlotInput } from "@/types/planner";
import { Box } from "@mui/material";
import TextField from "@mui/material/TextField";
import React, { useEffect, useMemo } from "react";

interface BcxInputProps {
  slot: SlotInput;
  onChange: (bcx: number) => void;
}

export const BcxInput: React.FC<BcxInputProps> = ({ slot, onChange }) => {
  const foilId = slot.foil === "regular" ? 0 : 1;

  const maxBCX = useMemo(
    () => determineCardMaxBCX(slot.set.toLowerCase(), slot.rarity, foilId),
    [slot.set, slot.rarity, foilId],
  );

  // Ensure current value is always within [0, maxBCX] after external changes
  useEffect(() => {
    const current = Number(slot.bcx ?? 0);
    const clamped = Math.max(0, Math.min(current, maxBCX));
    if (current !== clamped) onChange(clamped);
  }, [maxBCX, slot.bcx, onChange]);

  return (
    <Box minWidth={75}>
      <TextField
        type="number"
        label="BCX"
        size="small"
        value={slot.bcx === 0 ? "" : slot.bcx}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            // Render empty but keep state valid as 0
            onChange(0);
            return;
          }
          const n = Math.floor(Number(raw));
          if (Number.isNaN(n)) return;

          const clamped = Math.max(0, Math.min(n, maxBCX));
          onChange(clamped);
        }}
        slotProps={{
          input: {
            // Props for the underlying <input>
            inputProps: {
              min: 0,
              max: maxBCX,
              step: 1,
              inputMode: "numeric",
            },
          },
        }}
        sx={{
          minWidth: 75,
          maxWidth: 75,
          "& .MuiInputBase-input": { color: "common.white" },
          "& .MuiInputLabel-root": { color: "common.white" },
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "common.white" },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "common.white",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "common.white",
          },
        }}
      />
    </Box>
  );
};
