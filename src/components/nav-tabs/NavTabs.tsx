"use client";

import { Page } from "@/types/Page";
import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tabs,
  useMediaQuery,
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
  const isMobile = useMediaQuery("(max-width:600px)");
  const isShort = useMediaQuery("(max-height: 420px)");
  const compact = isMobile || isShort;

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
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        position: "sticky",
        top: 0,
        zIndex: 1100,
        borderBottom: `1px solid var(--mui-palette-divider)`,
        backgroundColor: "var(--mui-palette-background-default)",
      }}
    >
      {isMobile ? (
        <Box
          width={"100%"}
          m={1}
          sx={{ backgroundColor: "var(--mui-palette-background-default)" }}
        >
          <Select
            value={pages[value].label}
            onChange={handleSelectChange}
            fullWidth
            size="small"
          >
            {pages.map((page) => (
              <MenuItem key={page.label} value={page.label}>
                {page.label}
              </MenuItem>
            ))}
          </Select>
        </Box>
      ) : (
        <Tabs
          value={value}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: compact ? 22 : 36,
          }}
        >
          {pages.map((page) => (
            <GlowingTab
              key={page.label}
              label={page.label}
              compact={compact ?? undefined}
            />
          ))}
        </Tabs>
      )}
    </Box>
  );
}
