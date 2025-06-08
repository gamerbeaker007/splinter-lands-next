import FilterDrawer from "@/components/filter/FilterDrawer";
import ActiveDeedsChart from "@/components/region-overview/active/ActiveDeedsChart";
import BubbleScatterChart from "@/components/region-overview/demo/BubbleScatterChart";
import WorksiteTypeTile from "@/components/region-overview/summary/WorksiteTypeTile";
import { FilterInput } from "@/types/filters";
import { Container, Typography } from "@mui/material";

export default async function RegionOverviewPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/filters`, {
    cache: "no-store",
  });

  const filterData: FilterInput = await res.json();

  return (
    <>
      <Container>
        <Typography variant="h5">Regoin OVerview</Typography>
        <FilterDrawer filterValues={filterData} />
        <ActiveDeedsChart />
        <BubbleScatterChart />
        <WorksiteTypeTile />
      </Container>
    </>
  );
}
