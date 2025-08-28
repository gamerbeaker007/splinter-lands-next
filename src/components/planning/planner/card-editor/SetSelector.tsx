"use client";
import {
  edition_apha_icon_url,
  edition_beta_icon_url,
  edition_chaos_icon_url,
  edition_conclave_icon_url,
  edition_rebellion_icon_url,
  edition_untamed_icon_url,
} from "@/lib/shared/statics_icon_urls";
import {
  CardElement,
  cardSetModifiers,
  CardSetName,
  cardSetOptions,
} from "@/types/planner";
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

export type Props = {
  value: CardSetName;
  onChange: (tier: CardElement) => void;
};

const ICONS: Record<CardSetName, string> = {
  alpha: edition_apha_icon_url,
  beta: edition_beta_icon_url,
  untamed: edition_untamed_icon_url,
  chaos: edition_chaos_icon_url,
  rebellion: edition_rebellion_icon_url,
  conclave: edition_conclave_icon_url,
};

export function SetSelector({ value, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<CardSetName>) => {
    onChange(e.target.value as CardSetName);
  };

  const renderIcon = (tier: CardSetName, size = 24) => {
    return (
      <Image
        src={ICONS[tier]}
        alt={`${tier} element`}
        width={size}
        height={size}
        style={{ display: "block" }}
      />
    );
  };

  return (
    <Box borderRadius={1} minWidth={105}>
      <FormControl size="small" variant="outlined">
        <InputLabel sx={{ color: "common.white" }}>Set:</InputLabel>
        <Select<CardSetName>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as CardSetName) ?? value;
            return (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
                minWidth={60}
              >
                {renderIcon(v)}
                <Typography fontSize={14} fontWeight={600}>
                  {cardSetModifiers[v]}x
                </Typography>
              </Box>
            );
          }}
          MenuProps={{ MenuListProps: { dense: true } }}
          sx={{
            bgcolor: "rgba(255,255,255,0.06)",
            color: "common.white",
            ".MuiOutlinedInput-notchedOutline": { border: "none" },
          }}
        >
          {cardSetOptions.map((setName) => (
            <MenuItem key={setName} value={setName}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {renderIcon(setName, 18)}
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
                  {`${capitalize(setName)} (${cardSetModifiers[setName]}x)`}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
