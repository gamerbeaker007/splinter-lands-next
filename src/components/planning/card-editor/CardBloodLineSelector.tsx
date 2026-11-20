"use client";
import { useCardBloodlineOptions } from "@/hooks/useCardBloodlineOptions";
import { CardBloodline } from "@/types/planner";
import {
  Box,
  FormControl,
  InputLabel,
  ListItemIcon,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
  Typography,
} from "@mui/material";

export type Props = {
  value: CardBloodline;
  onChange: (bloodline: CardBloodline) => void;
};

export function CardBloodLineSelector({ value, onChange }: Props) {
  const bloodlineOptions = useCardBloodlineOptions();

  const handleChange = (e: SelectChangeEvent<CardBloodline>) => {
    onChange(e.target.value);
  };

  const renderIcon = (bloodline: CardBloodline) => {
    const suffix = bloodline.length > 5 ? "..." : "";
    return (
      <Typography variant={"body1"}>
        {bloodline.slice(0, 5)}
        {suffix}{" "}
      </Typography>
    );
  };

  const fontColor = "common.white";

  return (
    <Box borderRadius={1} minWidth={100}>
      <FormControl size="small" variant="outlined" fullWidth>
        <InputLabel sx={{ color: fontColor }}>Bloodline</InputLabel>
        <Tooltip title={value} placement={"top-start"}>
          <Select<CardBloodline>
            value={value}
            onChange={handleChange}
            displayEmpty
            renderValue={(val) => {
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {renderIcon(val)}
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
            {value && !bloodlineOptions.includes(value) && (
              <MenuItem value={value}>{value}</MenuItem>
            )}
            {bloodlineOptions.map((bloodline) => (
              <MenuItem key={bloodline} value={bloodline}>
                <ListItemIcon sx={{ minWidth: 32 }}>{bloodline}</ListItemIcon>
              </MenuItem>
            ))}
          </Select>
        </Tooltip>
      </FormControl>
    </Box>
  );
}
