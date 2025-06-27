"use client";

import { Page } from "@/types/Page";
import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tabs,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import GlowingTab from "../ui/GlowingTab";

type NavTabsProps = {
  pages: Page[];
  value: number;
  onChange: (
    event: React.SyntheticEvent | SelectChangeEvent,
    newValue: number,
  ) => void;
};

export default function NavTabs({ pages, value, onChange }: NavTabsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleSelectChange = (event: SelectChangeEvent) => {
    const newIndex = pages.findIndex((p) => p.label === event.target.value);
    if (newIndex !== -1) {
      onChange(event, newIndex);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    onChange(event, newValue);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}>
      {isMobile ? (
        <Select
          value={pages[value].label}
          onChange={handleSelectChange}
          fullWidth
          size="small"
          sx={{ pr: "10px" }}
        >
          {pages.map((page) => (
            <MenuItem key={page.label} value={page.label}>
              {page.label}
            </MenuItem>
          ))}
        </Select>
      ) : (
        <Tabs
          value={value}
          onChange={handleTabChange}
          aria-label="nav tabs"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {pages.map((page) => (
            <GlowingTab key={page.label} label={page.label} />
          ))}
        </Tabs>
      )}
    </Box>
  );
}
