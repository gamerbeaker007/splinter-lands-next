import FilterDrawer from "@/components/filter/FilterDrawer";
import NavTabs from "@/components/nav-tabs/NavTabs";
import ActiveDeedsChart from "@/components/region-overview/active/ActiveDeedsChart";
import SummaryPage from "@/components/region-overview/summary/SummaryPage";
import { FilterProvider } from "@/lib/context/FilterContext";
import { Page } from "@/types/Page";
import { Container, Typography } from "@mui/material";

const pages: Page[] = [
  { label: "Summary", component: <SummaryPage /> },
  { label: "Production", component: <div>Testing</div> },
  { label: "Test", component: <div>Teting 2</div> },
  { label: "Test2", component: <div>Testing</div> },
];

export default async function RegionOverviewPage() {
  return (
    <FilterProvider>
      <Container>
        <Typography variant="h5">Region Overview</Typography>
        <FilterDrawer />
        <NavTabs pages={pages} />

        <ActiveDeedsChart />
      </Container>
    </FilterProvider>
  );
}
