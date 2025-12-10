"use client";

import FilterDrawer from "@/components/filter/FilterDrawer";
import PageNavTabs from "@/components/nav-tabs/PageNavTabs";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Container } from "@mui/material";
import { useEffect, ReactNode } from "react";

type RegionOverviewLayoutProps = {
  children: ReactNode;
  filterOptions?: {
    regions?: boolean;
    tracts?: boolean;
    plots?: boolean;
    attributes?: boolean;
    player?: boolean;
    sorting?: boolean;
  };
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
];

const defaultFilterConfig = {
  regions: true,
  tracts: true,
  plots: true,
  attributes: true,
  player: true,
  sorting: false,
};

export default function RegionOverviewLayout({
  children,
  filterOptions = defaultFilterConfig,
}: RegionOverviewLayoutProps) {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Region Overview");
  }, [setTitle]);

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
