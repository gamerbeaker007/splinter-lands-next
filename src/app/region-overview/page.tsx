"use client";
import FilterDrawer from "@/components/filter/FilterDrawer";
import NavTabs from "@/components/nav-tabs/NavTabs";
import ActiveDeedsChart from "@/components/region-overview/active/ActiveDeedsChart";
import SummaryPage from "@/components/region-overview/summary/SummaryPage";
import { FilterProvider } from "@/lib/context/FilterContext";
import { usePageTitle } from "@/lib/context/PageTitleContext";
import { Page } from "@/types/Page";
import { Container } from "@mui/material";
import { useEffect } from "react";

const pages: Page[] = [
  { label: "Activity", component: <ActiveDeedsChart /> },
  { label: "Summary", component: <SummaryPage /> },
  { label: "Production", component: <div>Testing</div> },
  { label: "Test", component: <div>Teting 2</div> },
  { label: "Test2", component: <div>Testing</div> },
];

export default function RegionOverviewPage() {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("Region Overview");
  }, [setTitle]);

  return (
    <FilterProvider>
      <Container>
        <FilterDrawer />
        <NavTabs pages={pages} />
      </Container>
    </FilterProvider>
  );
}
