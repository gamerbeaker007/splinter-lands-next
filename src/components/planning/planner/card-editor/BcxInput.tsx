import { determineCardMaxBCX } from "@/lib/utils/cardUtil";
import { SlotInput } from "@/types/planner";
import { Box } from "@mui/material";
import TextField from "@mui/material/TextField";
import React from "react";

interface BcxInputProps {
  slot: SlotInput;
  onChange: (bxc: number) => void;
}

export const BcxInput: React.FC<BcxInputProps> = ({ slot, onChange }) => {
  const foilId = slot.foil === "regular" ? 0 : 1; // for other variant use gold foil
  const maxBCX = determineCardMaxBCX(
    slot.set.toLowerCase(),
    slot.rarity,
    foilId,
  );

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
            onChange(0); // keep slot valid, but render as ""
            return;
          }
          const newVal = Math.min(Number(raw), maxBCX);
          onChange(newVal);
        }}
        inputProps={{
          min: 0,
          max: maxBCX,
        }}
        sx={{
          maxWidth: 75,
          "& .MuiInputBase-input": {
            color: "common.white", // input text
          },
          "& .MuiInputLabel-root": {
            color: "common.white", // label text
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "common.white", // border
          },
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
