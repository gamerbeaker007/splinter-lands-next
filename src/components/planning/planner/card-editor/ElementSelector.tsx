"use client";
import { land_default_element_icon_url_placeholder } from "@/lib/shared/statics_icon_urls";
import {
  CardElement,
  cardElementOptions,
  DeedType,
  TERRAIN_BONUS,
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
  value: CardElement;
  deedType: DeedType;
  onChange: (tier: CardElement) => void;
};

export function terrainBonusPct(
  terrain: DeedType,
  element: CardElement,
): number {
  if (!terrain) return 0;
  return TERRAIN_BONUS[terrain]?.[element] ?? 0;
}

/** Helper: 0 -> null, 0.15 -> +15%, -0.1 -> -10%  */
function formatBoostPct(pct: number): string | null {
  const n = Math.round(pct * 100);
  if (n === 0) return null;
  return `${n > 0 ? "+" : ""}${n}%`;
}

function BoostTag({ boost }: { boost: number }) {
  const label = formatBoostPct(boost);
  if (!label) return null;
  const isPositive = boost > 0;
  return (
    <Box
      component="span"
      sx={{
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
        bgcolor: isPositive ? "success.light" : "error.light",
        color: "common.black",
        fontWeight: 700,
        fontSize: 12,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {label}
    </Box>
  );
}

export function CardElementSelector({ value, deedType, onChange }: Props) {
  const handleChange = (e: SelectChangeEvent<CardElement>) => {
    onChange(e.target.value as CardElement);
  };

  const renderIcon = (tier: CardElement, size = 24) => {
    const icon = land_default_element_icon_url_placeholder.replace(
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

  const boostFor = (tier: CardElement) => terrainBonusPct(deedType, tier);
  const fontColor = "common.white";

  return (
    <Box borderRadius={1} minWidth={115}>
      <FormControl size="small" variant="outlined" fullWidth>
        <InputLabel sx={{ color: fontColor }}>Element</InputLabel>
        <Select<CardElement>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            const v = (val as CardElement) ?? value;
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {renderIcon(v)}
                {/* collapsed: icon + (optional) boost pill only */}
                <BoostTag boost={boostFor(v)} />
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
          {cardElementOptions.map((tier) => (
            <MenuItem key={tier} value={tier}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {renderIcon(tier, 18)}
              </ListItemIcon>

              {/* expanded: tier text + boost pill */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {capitalize(tier)}
                </Typography>
                <BoostTag boost={boostFor(tier)} />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
