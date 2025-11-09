"use client";
import {
  land_hammer_icon_url,
  land_runi_gold_icon_url,
  land_runi_power_core_icon_url,
  land_runi_regular_icon_url,
} from "@/lib/shared/statics_icon_urls";
import { CSSSize } from "@/types/cssSize";
import {
  PlotPlannerData,
  RUNI_FLAT_ADD,
  runiModifiers,
  runiOptions,
  RuniTier,
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
import { calcBoostedPP } from "../../../lib/frontend/utils/plannerCalcs";

const ICONS: Record<RuniTier, string> = {
  none: land_runi_power_core_icon_url,
  regular: land_runi_regular_icon_url,
  gold: land_runi_gold_icon_url,
};

const fontColor = "common.white";

const renderBoost = (value: RuniTier, plot: PlotPlannerData, size = 15) => {
  const basePP = RUNI_FLAT_ADD[value];
  const boostedPP = calcBoostedPP(basePP, plot, 0);
  return (
    <Box display={"flex"}>
      <Box display={"flex"} gap={1} ml={1} mt={1}>
        <Image
          src={land_hammer_icon_url}
          alt={"production PP"}
          width={size}
          height={size}
          style={{ display: "block" }}
        />
        <Typography fontSize={10} color={fontColor}>
          Base PP : {basePP.toFixed()}
        </Typography>
      </Box>
      <Box display={"flex"} gap={1} ml={1} mt={1}>
        <Image
          src={land_hammer_icon_url}
          alt={"production PP"}
          width={size}
          height={size}
          style={{ display: "block" }}
        />
        <Typography fontSize={10} color={fontColor}>
          Boosted PP :{" "}
        </Typography>
        <Typography fontSize={10} color="success">
          {boostedPP.toFixed()}
        </Typography>
      </Box>
    </Box>
  );
};

const renderIcon = (tier: RuniTier, runiImgUrl: string | null, size = 50) => {
  const icon = runiImgUrl ?? ICONS[tier];
  const isPowerCore = icon === land_runi_power_core_icon_url;

  const isGold = icon.includes("gold");

  const style: React.CSSProperties = isPowerCore
    ? {
        objectFit: "fill",
      }
    : {
        objectFit: "cover",
        transform: `scale(1.6)`,
        transformOrigin: "center",
        objectPosition: "0% 0%",
      };

  return (
    <Box
      aria-label="Deed preview"
      sx={{
        width: size,
        height: size,
        border: "2px solid",
        borderColor: isGold ? "yellow" : "gray",
        position: "relative",
        overflow: "hidden",
        borderRadius: 1,
      }}
    >
      <Image src={icon} alt={`${tier} runi`} fill sizes="10" style={style} />
    </Box>
  );
};

export type Props = {
  value: RuniTier;
  plotPlannerData: PlotPlannerData;
  runiImgUrl: string | null;
  onChange: (tier: RuniTier) => void;
  pos?: { x?: CSSSize; y?: CSSSize; w?: CSSSize };
};

export function RuniSelector({
  value,
  runiImgUrl,
  plotPlannerData,
  onChange,
  pos,
}: Props) {
  const { x = "0px", y = "0px", w = "auto" } = pos || {};
  const handleChange = (e: SelectChangeEvent<RuniTier>) => {
    onChange(e.target.value as RuniTier);
  };

  const label = (tier: RuniTier) => {
    return tier === "none"
      ? "Power Core (0%)"
      : `${capitalize(tier)} (${runiModifiers[tier] * 100}%)`;
  };

  return (
    <Box
      borderRadius={1}
      sx={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        p: 1,
        bgcolor: "rgba(0,0,0,0.6)",

        zIndex: 2,
      }}
    >
      <FormControl size="small" variant="outlined" sx={{ minWidth: 230 }}>
        <InputLabel sx={{ color: fontColor }}>Power Core:</InputLabel>
        <Select<RuniTier>
          value={value}
          onChange={handleChange}
          displayEmpty
          renderValue={(val) => {
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {renderIcon(val as RuniTier, runiImgUrl)}
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {label(val as RuniTier)}
                </Typography>
              </Box>
            );
          }}
          MenuProps={{ MenuListProps: { dense: true } }}
          sx={{
            bgcolor: "rgba(255,255,255,0.06)",
            ".MuiOutlinedInput-notchedOutline": { border: "none" },
            color: fontColor,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.6)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
          }}
        >
          {runiOptions.map((v) => (
            <MenuItem key={v} value={v}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {renderIcon(v, null, 18)}
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
                  {capitalize(v)} ({runiModifiers[v] * 100}%)
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {value !== "none" && renderBoost(value, plotPlannerData)}
    </Box>
  );
}
