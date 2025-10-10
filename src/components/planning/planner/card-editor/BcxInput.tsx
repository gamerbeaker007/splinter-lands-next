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

  const fontColor = "common.white";
  return (
    <Box minWidth={60}>
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
          minWidth: 60,
          maxWidth: 60,
          // Hide arrows in Chrome, Safari, Edge, Opera
          "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
            {
              display: "none",
            },
          // Hide arrows in Firefox
          "& input[type=number]": {
            MozAppearance: "textfield",
          },
          "& .MuiInputBase-input": { color: fontColor },
          "& .MuiInputLabel-root": { color: fontColor },
          "& .MuiOutlinedInput-notchedOutline": { bordercolor: fontColor },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            bordercolor: fontColor,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            bordercolor: fontColor,
          },
        }}
      />
    </Box>
  );
};
