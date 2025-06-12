"use client";

import { useState } from "react";
import {
  Box,
  Tabs,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  SelectChangeEvent,
} from "@mui/material";
import GlowingTab from "../ui/GlowingTab";
import { Page } from "@/types/Page";

type NavTabsProps = {
  pages: Page[];
};

export default function NavTabs({ pages }: NavTabsProps) {
  const [value, setValue] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleChange = (event: SelectChangeEvent | number) => {
    const newIndex =
      typeof event === "number"
        ? event
        : pages.findIndex((p) => p.label === event.target.value);
    setValue(newIndex);
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "center", px: 2, pt: 2 }}>
        {isMobile ? (
          <Select
            value={pages[value].label}
            onChange={handleChange}
            fullWidth
            size="small"
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
            onChange={(_, newValue) => handleChange(newValue)}
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
      <Box sx={{ mt: 4, px: 2 }}>{pages[value].component}</Box>
    </>
  );
}
