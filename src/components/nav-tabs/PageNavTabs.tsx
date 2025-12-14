"use client";

import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tabs,
  useMediaQuery,
} from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import GlowingTab from "../ui/GlowingTab";

type PageNavItem = {
  key: string;
  label: string;
  path: string;
};

type PageNavTabsProps = {
  pages: PageNavItem[];
  basePath?: string;
};

export default function PageNavTabs({
  pages,
  basePath = "",
}: PageNavTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isShort = useMediaQuery("(max-height: 420px)");
  const compact = isMobile || isShort;

  // Find current active tab based on pathname
  const activeIndex = pages.findIndex((page) => {
    const fullPath = basePath ? `${basePath}${page.path}` : page.path;
    return pathname === fullPath || pathname.startsWith(`${fullPath}?`);
  });
  const value = activeIndex >= 0 ? activeIndex : 0;

  const handleSelectChange = (event: SelectChangeEvent) => {
    const page = pages.find((p) => p.label === event.target.value);
    if (page) {
      const fullPath = basePath ? `${basePath}${page.path}` : page.path;
      router.push(fullPath);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const page = pages[newValue];
    if (page) {
      const fullPath = basePath ? `${basePath}${page.path}` : page.path;
      router.push(fullPath);
    }
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
      {compact ? (
        <Box justifyItems={"left"} width={"100%"}>
          <Select
            value={pages[value]?.label || ""}
            onChange={handleSelectChange}
            sx={{
              m: 1,
              minWidth: 200,
            }}
          >
            {pages.map((page) => (
              <MenuItem key={page.key} value={page.label}>
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
            <GlowingTab key={page.key} label={page.label} />
          ))}
        </Tabs>
      )}
    </Box>
  );
}
