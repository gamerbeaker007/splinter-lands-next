"use client";
import { cardSetIconMap, CardSetNameLandValid } from "@/types/editions";
import { cardSetModifiers } from "@/types/planner";
import { edition_verico_icon_url } from "@/lib/shared/statics_icon_urls";
import {
  Box,
  capitalize,
  FormControl,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import Image from "next/image";

/**
 * Value emitted by the selector. Verico is not a real set (it is edition 21 of
 * the land set); the caller maps "verico" to set="land" + isVerico.
 */
export type SetSelection = CardSetNameLandValid | "verico";

// Verico shares the land-set modifier (1x). It is only visually distinct.
const VERICO_MODIFIER = cardSetModifiers.land;

export type Props = {
  value: CardSetNameLandValid;
  /** When true the slot represents a Verico (land edition 21) card. */
  isVerico?: boolean;
  onChange: (selection: SetSelection) => void;
};

export function SetSelector({ value, isVerico, onChange }: Props) {
  const current: SetSelection = isVerico ? "verico" : value;

  const handleChange = (e: SelectChangeEvent<SetSelection>) => {
    onChange(e.target.value as SetSelection);
  };

  const renderIcon = (selection: SetSelection, size = 24) => {
    const src =
      selection === "verico"
        ? edition_verico_icon_url
        : cardSetIconMap[selection];
    return (
      <Image
        src={src}
        alt={`${selection} element`}
        width={size}
        height={size}
        style={{ display: "block" }}
      />
    );
  };

  const fontColor = "common.white";

  return (
    <Box borderRadius={1} minWidth={90}>
      <FormControl size="small" variant="outlined" fullWidth>
        <InputLabel sx={{ color: fontColor }}>Set:</InputLabel>
        <Select<SetSelection>
          value={current}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as SetSelection) ?? current;
            const modifier =
              v === "verico" ? VERICO_MODIFIER : cardSetModifiers[v];
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {renderIcon(v)}
                <Typography variant="caption">{modifier}x</Typography>
              </Box>
            );
          }}
          MenuProps={{ MenuListProps: { dense: true } }}
          sx={{
            bgcolor: "rgba(255,255,255,0.06)",
            color: fontColor,
            ".MuiOutlinedInput-notchedOutline": { border: "none" },
          }}
        >
          {Object.entries(cardSetModifiers).map(([setName, modifier]) => (
            <MenuItem key={setName} value={setName}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {renderIcon(setName as CardSetNameLandValid, 18)}
              </ListItemIcon>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {`${capitalize(setName)} (${modifier}x)`}
                </Typography>
              </Box>
            </MenuItem>
          ))}
          {/* Verico is a visual-only land edition (edition 21, common only). */}
          <MenuItem value="verico">
            <ListItemIcon sx={{ minWidth: 32 }}>
              {renderIcon("verico", 18)}
            </ListItemIcon>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                gap: 1,
              }}
            >
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {`Verico (${VERICO_MODIFIER}x)`}
              </Typography>
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
