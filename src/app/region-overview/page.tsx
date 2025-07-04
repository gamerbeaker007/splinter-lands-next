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

const pages: Page[] = [
  { label: "Activity", component: <ActivityPage /> },
  { label: "Production", component: <ProductionPage /> },
  { label: "Summary", component: <SummaryPage /> },
];

export default function RegionOverviewPage() {
  const { setTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    setTitle("Region Overview");
  }, [setTitle]);

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 6, lg: 12 } }}>
      <FilterProvider>
        <FilterDrawer />
        <NavTabs
          pages={pages}
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        />
        <Box mt={4}>{pages[activeTab].component}</Box>
      </FilterProvider>
    </Container>
  );
}
