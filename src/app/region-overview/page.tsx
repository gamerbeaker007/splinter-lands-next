import ActiveDeedsChart from "@/components/region-overview/active/ActiveDeedsChart";
import BubbleScatterChart from "@/components/region-overview/demo/BubbleScatterChart";
import WorksiteTypeTile from "@/components/region-overview/summary/WorksiteTypeTile";
import { Container, Typography } from "@mui/material";

export default function RegionOverviewPage() {
  return (
    <>
      <Container>
        <Typography variant="h5">Regoin OVerview</Typography>
        <ActiveDeedsChart />
        <BubbleScatterChart />
        <WorksiteTypeTile />
      </Container>
    </>
  );
}
