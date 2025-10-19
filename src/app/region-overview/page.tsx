"use client";
import FilterDrawer from "@/components/filter/FilterDrawer";
import NavTabs from "@/components/nav-tabs/NavTabs";
import { ActivityPage } from "@/components/region-overview/active/ActivePage";
import SummaryPage from "@/components/region-overview/summary/SummaryPage";
import { FilterProvider } from "@/lib/frontend/context/FilterContext";
import { usePageTitle } from "@/lib/frontend/context/PageTitleContext";
import { Page } from "@/types/Page";
import { Box, Container } from "@mui/material";
import { useEffect, useState } from "react";
import { ProductionPage } from "@/components/region-overview/production/ProductionPage";
import { ComparePage } from "@/components/region-overview/compare/ComparePage";
import { TaxPage } from "@/components/region-overview/tax/TaxPage";
import { EnableFilterOptions } from "@/types/filters";
import TractDeedOverviewPage from "@/components/region-overview/tract-deed-overview/TractDeedOverviewPage";

const defaultFilterConfig: EnableFilterOptions = {
  regions: true,
  tracts: true,
  plots: true,
  attributes: true,
  player: true,
  sorting: false,
};

const taxFilterConfig: EnableFilterOptions = {
  regions: true,
  tracts: true,
  plots: false,
  attributes: false,
  player: false,
  sorting: false,
};

const tractFilterConfig: EnableFilterOptions = {
  regions: false,
  tracts: false,
  plots: true,
  attributes: true,
  player: false,
  sorting: true,
};

const pages: Page[] = [
  {
    key: "activity",
    label: "Activity",
    component: <ActivityPage />,
    filterOptions: defaultFilterConfig,
  },
  {
    key: "production",
    label: "Production",
    component: <ProductionPage />,
    filterOptions: defaultFilterConfig,
  },
  {
    key: "compare",
    label: "Compare",
    component: <ComparePage />,
    filterOptions: defaultFilterConfig,
  },
  {
    key: "summary",
    label: "Summary",
    component: <SummaryPage />,
    filterOptions: defaultFilterConfig,
  },
  {
    key: "Tract Analysis",
    label: "Tract Analysis",
    component: <TractDeedOverviewPage />,
    filterOptions: tractFilterConfig,
  },

  {
    key: "tax",
    label: "Tax",
    component: <TaxPage />,
    filterOptions: taxFilterConfig,
  },
];

export default function RegionOverviewPage() {
  const { setTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    setTitle("Region Overview");
  }, [setTitle]);

  const activePage = pages[activeTab];

  return (
    <FilterProvider>
      <FilterDrawer filtersEnabled={activePage.filterOptions} />
      <NavTabs
        pages={pages}
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
      />
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
        <Box mt={4} mb={4}>
          {activePage.component}
        </Box>
      </Container>
    </FilterProvider>
  );
}
