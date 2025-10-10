"use client";
import {
  CardBloodline,
  cardBloodlineOptions,
  CardElement,
} from "@/types/planner";
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
  const handleChange = (e: SelectChangeEvent<CardElement>) => {
    onChange(e.target.value as CardBloodline);
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
          <Select<CardElement>
            value={value}
            onChange={handleChange}
            displayEmpty
            renderValue={(val) => {
              const v = (val as CardBloodline) ?? value;
              return (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {renderIcon(v)}
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
            {cardBloodlineOptions.map((bloodline) => (
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
