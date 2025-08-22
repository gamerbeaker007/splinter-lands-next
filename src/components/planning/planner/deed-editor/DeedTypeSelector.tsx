"use client";
import { land_default_off_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import {
  DEED_BLOCKED,
  DeedType,
  deedTypeOptions,
  MagicType,
  PlotStatus,
} from "@/types/planner";
import {
  Box,
  FormControl,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import Image from "next/image";

export type Props = {
  value: DeedType;
  plotStatus: PlotStatus;
  magicType: MagicType;
  onChange: (tier: DeedType) => void;
};

function capitalize(word: string) {
  return word ? word[0].toUpperCase() + word.slice(1) : word;
}

export function DeedTypeSelector({
  value,
  plotStatus,
  magicType,
  onChange,
}: Props) {
  const handleChange = (e: SelectChangeEvent<DeedType>) => {
    onChange(e.target.value as DeedType);
  };

  const disabledDeed = (d: DeedType) =>
    plotStatus === "Magical" &&
    magicType !== "" &&
    (DEED_BLOCKED[magicType]?.includes(d) ?? false);

  const renderIcon = (tier: DeedType, size = 24) => {
    const icon = land_default_off_icon_url_placeholder.replace(
      "__NAME__",
      tier.toLowerCase(),
    );
    return (
      <Image
        src={icon}
        alt={`${tier} element`}
        width={size}
        height={size}
        style={{ display: "block" }}
      />
    );
  };

  return (
    <Box borderRadius={1}>
      <FormControl size="small" variant="outlined">
        <InputLabel>DeedType:</InputLabel>
        <Select<DeedType>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as DeedType) ?? value;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {renderIcon(v)}
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {capitalize(v)}
                </Typography>
              </Box>
            );
          }}
          MenuProps={{ MenuListProps: { dense: true } }}
          sx={{
            bgcolor: "rgba(255,255,255,0.06)",
            ".MuiOutlinedInput-notchedOutline": { border: "none" },
          }}
        >
          {deedTypeOptions.map((v) => (
            <MenuItem key={v} value={v} disabled={disabledDeed(v)}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {renderIcon(v, 18)}
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
                  {capitalize(v)}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
