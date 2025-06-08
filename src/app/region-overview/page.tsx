import FilterDrawer from "@/components/filter/FilterDrawer";
import ActiveDeedsChart from "@/components/region-overview/active/ActiveDeedsChart";
import WorksiteTypeTile from "@/components/region-overview/summary/WorksiteTypeTile";
import { FilterProvider } from "@/lib/context/FilterContext";
import { Container, Typography } from "@mui/material";

export default async function RegionOverviewPage() {
  return (
    <FilterProvider>
      <Container>
        <Typography variant="h5">Region Overview</Typography>
        <FilterDrawer />
        <WorksiteTypeTile />
        <ActiveDeedsChart />
      </Container>
    </FilterProvider>
  );
}
