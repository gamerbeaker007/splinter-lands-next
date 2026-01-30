"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import PageNavTabs from "@/components/nav-tabs/PageNavTabs";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Container } from "@mui/material";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";

type RegionOverviewLayoutProps = {
  children: ReactNode;
};

type FilterConfig = {
  regions?: boolean;
  tracts?: boolean;
  plots?: boolean;
  attributes?: boolean;
  player?: boolean;
  sorting?: boolean;
};

const pages = [
  { key: "activity", label: "Activity", path: "/region-overview/activity" },
  {
    key: "production",
    label: "Production",
    path: "/region-overview/production",
  },
  { key: "compare", label: "Compare", path: "/region-overview/compare" },
  { key: "summary", label: "Summary", path: "/region-overview/summary" },
  {
    key: "tract-analysis",
    label: "Tract Analysis",
    path: "/region-overview/tract-analysis",
  },
  { key: "tax", label: "Tax", path: "/region-overview/tax" },
  {
    key: "inactivity",
    label: "Inactivity",
    path: "/region-overview/inactivity",
  },
];

const defaultFilterConfig: FilterConfig = {
  regions: true,
  tracts: true,
  plots: true,
  attributes: true,
  player: true,
  sorting: false,
};

const pageFilterConfigs: Record<string, FilterConfig> = {
  "/region-overview/tax": {
    regions: true,
    tracts: true,
    plots: false,
    attributes: false,
    player: false,
    sorting: false,
  },
  "/region-overview/tract-analysis": {
    regions: false,
    tracts: false,
    plots: true,
    attributes: true,
    player: false,
    sorting: true,
  },
  "/region-overview/inactivity": {
    regions: true,
    tracts: true,
    plots: true,
    attributes: true,
    player: true,
    sorting: false,
  },
};

export default function RegionOverviewLayout({
  children,
}: RegionOverviewLayoutProps) {
  usePageTitle("Region Overview");
  const pathname = usePathname();

  const filterOptions = useMemo(() => {
    return pageFilterConfigs[pathname] || defaultFilterConfig;
  }, [pathname]);

  return (
    <FilterProvider>
      <FilterDrawer filtersEnabled={filterOptions} />
      <Container maxWidth={false} sx={{ px: { xs: 1, md: 3, lg: 6 } }}>
        <PageNavTabs pages={pages} />
        {children}
      </Container>
    </FilterProvider>
  );
}
