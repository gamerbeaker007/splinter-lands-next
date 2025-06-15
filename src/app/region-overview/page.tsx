"use client";
import FilterDrawer from "@/components/filter/FilterDrawer";
import NavTabs from "@/components/nav-tabs/NavTabs";
import ActiveDeedsChart from "@/components/region-overview/active/ActiveDeedsChart";
import SummaryPage from "@/components/region-overview/summary/SummaryPage";
import { FilterProvider } from "@/lib/context/FilterContext";
import { usePageTitle } from "@/lib/context/PageTitleContext";
import { Page } from "@/types/Page";
import { Box, Container } from "@mui/material";
import { useEffect, useState } from "react";

const pages: Page[] = [
  { label: "Activity", component: <ActiveDeedsChart /> },
  { label: "Summary", component: <SummaryPage /> },
];

export default function RegionOverviewPage() {
  const { setTitle } = usePageTitle();
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    setTitle("Region Overview");
  }, [setTitle]);

  return (
    <FilterProvider>
      <Container>
        <FilterDrawer />
        <NavTabs
          pages={pages}
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        />
        <Box mt={4}>{pages[activeTab].component}</Box>
      </Container>
    </FilterProvider>
  );
}
